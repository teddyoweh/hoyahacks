import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { endpoints } from "../config/server";

export const useRecordVoice = () => {
  
  const [mediaRecorder, setMediaRecorder] = useState(null);

  
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  
  const chunks = useRef([]);

  
  const startRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.start();
      setRecording(true);
    }
  };

  
  const stopRecording = async () => {
    if (mediaRecorder) {
      mediaRecorder.stop(); 
      setRecording(false);
  
    }
  };

  
  const initialMediaRecorder = (stream) => {
    const mediaRecorder = new MediaRecorder(stream);

    
    mediaRecorder.onstart = () => {
      chunks.current = []; 
    };

    
    mediaRecorder.ondataavailable = (ev) => {
      chunks.current.push(ev.data); 
    };

    
    mediaRecorder.onstop = async() => {
      
      const audioBlob = new Blob(chunks.current, { type: "audio/wav" });
      alert(JSON.stringify(chunks));
      const formData = new FormData();
      formData.append("audio", audioBlob);
      await axios.post(endpoints.audio_record, {formData}).then((res) => {
        console.log(res);
      }
        );

      
    };

    setMediaRecorder(mediaRecorder);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(initialMediaRecorder);
    }
  }, []); 

  return { recording, startRecording, stopRecording, audioBlob
 };
};