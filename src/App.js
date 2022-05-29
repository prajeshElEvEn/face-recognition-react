import logo from './logo.svg';
import * as faceapi from '@vladmandic/face-api'
import './App.css';
import { useEffect, useRef } from 'react';

function App() {

  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const videoHeight = 420;
  const videoWidth = 640;

  const handlePlay = async () => {
    setInterval(async () => {
      const labeledFaceDescriptors = await recogFace()
      console.log(labeledFaceDescriptors)
      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)

      const detections = await faceapi
        .detectAllFaces(
          videoRef.current,
          new faceapi.SsdMobilenetv1Options()
        )
        .withFaceLandmarks()
        .withFaceDescriptors()

      canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current)

      faceapi.matchDimensions(canvasRef.current, {
        width: videoRef.current.width,
        height: videoRef.current.height
      })
      const resizedDetections = faceapi.resizeResults(detections, {
        width: videoRef.current.width,
        height: videoRef.current.height
      })
      faceapi.draw.drawDetections(canvasRef.current, resizedDetections)
      // faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections)

      const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))

      results.forEach((result, i) => {
        const box = resizedDetections[i].detection.box
        const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
        drawBox.draw(canvasRef.current)
      })
    }, 100)
  }

  const recogFace = async () => {
    const labels = ['Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Rhodes', 'Thor', 'Tony Stark']
    return Promise.all(
      labels.map(async label => {
        const descriptions = []
        for (let i = 1; i <= 2; i++) {
          const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/WebDevSimplified/Face-Recognition-JavaScript/master/labeled_images/${label}/${i}.jpg`)
          // console.log(img)
          const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
          descriptions.push(detections.descriptor)
        }
        console.log('descriptions loaded')
        return new faceapi.LabeledFaceDescriptors(label, descriptions)
      })
    )
  }

  const playVideo = async () => {
    await navigator.mediaDevices.getUserMedia({
      video: true
    })
      .then((stream) => {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        handlePlay()
      })
  }

  useEffect(() => {
    const loadModels = async () => {
      Promise.all([
        await faceapi.nets.tinyFaceDetector.load('/models'),
        await faceapi.nets.ssdMobilenetv1.load('/models'),
        await faceapi.nets.ageGenderNet.load('/models'),
        await faceapi.nets.faceLandmark68Net.load('/models'),
        await faceapi.nets.faceRecognitionNet.load('/models'),
        await faceapi.nets.faceExpressionNet.load('/models'),
      ])
        .then(() => {
          playVideo()
          // handlePlay()
          console.log('models loaded');
        })
        .catch(err => {
          console.log(err);
        })
    }

    loadModels()
  }, [])


  return (
    <div className="App">
      <div className='form'>
        <video ref={videoRef} height={videoHeight} width={videoWidth} />
        <canvas ref={canvasRef} height={videoHeight} width={videoWidth} />
      </div>
    </div>
  );
}

export default App;
