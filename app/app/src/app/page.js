"use client"
import Image from 'next/image'
import "./styles/home.scss"
import { useEffect, useState,useRef } from 'react';
import { Microphone2 } from 'iconsax-react';
import { ReactMic } from 'react-mic';
import axios from 'axios';
import { endpoints,headers, ip } from './config/server';
import { useReactMediaRecorder } from "react-media-recorder";
 

  import { Recorder } from "react-voice-recorder";
import OpenAI from 'openai';

const ReadMore = ({ text, sentenceLimit }) => {
  const [showMore, setShowMore] = useState(false);
  
  const toggleShowMore = () => {
    setShowMore(!showMore);
  };

  const truncatedText = () => {
    const sentences = text.split(' ');
    const truncatedSentences = showMore ? sentences : sentences.slice(0, sentenceLimit);
    return truncatedSentences.join(' ') + (showMore ? '' : '...');
  };

  return (
    <div>
      <p>{truncatedText()}
      {text.length > sentenceLimit && (
        <a  className="showmore" onClick={toggleShowMore}>
          {showMore ? 'View Less' : 'View More'}
        </a>
      )}
      </p>
     
    </div>
  );
};

 
const SoundWave = ({state,ai,audiourl}) => {
  const bars = 80;
  const audioDataRef = useRef(new Uint8Array(bars));
  const [audioData, setAudioData] = useState(audioDataRef.current);

  useEffect(() => {
    const getMicrophone = async () => {
      const audio = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      // analyser.smoothingTimeConstant = 0.2; // Experiment with different values (0 to 1)

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const source = audioContext.createMediaStreamSource(audio);
      source.connect(analyser);

      const tick = () => {
        analyser.getByteTimeDomainData(dataArray);
      
 
        const scaledDataArray = dataArray.map(value => Math.log10(value + 1) * 30000);
      
 
        const spikeThreshold = 10;  
        const spikedArray = scaledDataArray.map((value, i) => {
          const diff = Math.abs(value - audioDataRef.current[i]);
      
           if (diff > spikeThreshold) {
            return value * 2;  
          } else {
            return value;
          }
        });
      
        audioDataRef.current = spikedArray;
        setAudioData([...spikedArray]);
        requestAnimationFrame(tick);
      };

      source.connect(analyser);
      tick();
    };

    getMicrophone();

    return () => {
      // Clean up resources if needed
    };
  }, []);

  return (
    <div className="sound-wave">
      {audioData.map((value, i) => (
        <div
          key={i}
          className="bar"
          style={{ height: state==true||ai==true ?`${((value / 250.0) * 30)}px`:"25px" }}
        ></div>
      ))}
    </div>
  );
};

 
 

export default function Home() {
  const [summarView, setSummarView] = useState(false)
  const [mic, setMic] = useState(false)
  const client = new OpenAI({apiKey:"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",dangerouslyAllowBrowser: true });
  const [transcript, setTranscript] = useState('');
  const [endText, setEndText] = useState(false);
  const [audiourl, setAudiourl] = useState(null)
  const [aitalking, setAitalking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  let recognition = null;

 
  if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
 
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

 
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      
      setTranscript((prev)=>prev+" "+text)
      
  
    };

    recognition.onend = () => {
      if (endText==false) {
        recognition.start();
      }

    };
  } else {
     console.error('SpeechRecognition is not supported in this browser');
  }

  const startRecognition = () => {

    recognition.start();
  };

  const stopRecognition = async () => {
    setEndText(true)
    recognition.stop();
    setLoading(true)
    await axios.post(endpoints.audio_record, {text:transcript}).then((res)=>{
     setAudiourl(`${ip+'/'+res.data.filename}`)
     setData((prev)=>[...prev,{title:res.data.title,answer:res.data.answer}])
      setAitalking(true)
      setTranscript('')
      setLoading(false)
    }
    )

  
  };
  const {
    status,
    startRecording,
    stopRecording,
    pauseRecording,
    mediaBlobUrl
  } = useReactMediaRecorder({
    video: false,
    audio: true,
    echoCancellation: true
  });
  
  async function chaageMic(){
    if(mic){
      stopRecognition()
 
    
    }
    else{
      startRecognition()
    }
    setMic(!mic)
    setAitalking(!aitalking)
  }
  async function sendAudio() {
    await new Promise(resolve => setTimeout(resolve, 3000));

   const trax =  client.audio.transcriptions.create(
      model="whisper-1",
      file=mediaBlobUrl
  )
 
  setTranscript(trax)
  alert(trax)
   
  
    //   const formData = new FormData();
    //   formData.append("audio", audioBlob, "audio.wav");
  
    
    //  await axios.post(endpoints.audio_record, formData, {
    //     headers: {
    //       "Content-Type": "multipart/form-data",
    //       ...headers
    //     }
    //   });
    // } catch (error) {
    //   console.error("Error sending audio:", error);
    // }
  }
  
useEffect(() => {
  //
}, [window])

  return (
    <div className="home">
      <div className={summarView?"wave-home active":"wave-home"}>
        <div className="box">

      <div className="status"
      onClick={()=>{setSummarView(!summarView)}}
      >
        <label htmlFor="">
        {
          mic?
          "Listening...":
          "Speak"
        }
        </label>
      </div>
      <div className="row">
        {
loading &&       <span class="loader"></span>
        }

  
      <SoundWave state={mic} ai={aitalking} audiourl={audiourl} />
      <audio src={audiourl} controls autoPlay  onEnded={()=>{
        setAudiourl(null)
        setAitalking(false)

      }}/>
 
  
      <div className="mic-stat"
      onClick={()=>{chaageMic()}}
      >
        {
          mic?
  
        <div className="stop"/>:
        <Microphone2 size="10" color="#888"/>}

 
      
      </div>
      </div>
      </div>
      </div>
    <div className={summarView?"summary-box active":"summary-box"}>
      <div className="body">
      <div className="top">
      <img className='logo' src="https://images.squarespace-cdn.com/content/v1/5409fd72e4b08734f6c05b4c/1661348815411-C5QDQRGZCGWOIXXUTMAG/Notification_Center.png?format=2500w"/>
      <div className="name">
        <label htmlFor="">
          Morgan State University
        </label>
      </div>
    </div>
    <div className="content">
      {
        data.map((_,i)=>{
          return (
            <div className="result">
            <div className="title">
              <label htmlFor="">
               {_.title}
              </label>
            </div>
            <div className="answer">
              <ReadMore text={_.answer} sentenceLimit={20}/>
            </div>
    
          </div>
          )
        })
      }
     

    </div>
      </div>
   
    </div>
 
    </div>
  )
}
