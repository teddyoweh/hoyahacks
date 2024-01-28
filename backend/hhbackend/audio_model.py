import os
import wave
import pyaudio
from tempfile import NamedTemporaryFile
from pydub import AudioSegment
from pydub.playback import play
from openai import OpenAI
from dotenv import load_dotenv

class audio_model:
    def __init__(self):
        load_dotenv()
        self.OPENAI_KEY = os.getenv('OPENAI_API_KEY')
        self.client = OpenAI()
        self.client.api_key = self.OPENAI_KEY

    def record_and_save_audio(self, file_path, duration=5, sample_rate=44100, channels=1, format_=pyaudio.paInt16):
        p = pyaudio.PyAudio()

        try:
            stream = p.open(format=format_,
                            channels=channels,
                            rate=sample_rate,
                            input=True,
                            frames_per_buffer=1024)

            print("Recording... Speak now.")

            frames = []
            for i in range(0, int(sample_rate / 1024 * duration)):
                data = stream.read(1024)
                frames.append(data)

            print("Recording complete.")

            stream.stop_stream()
            stream.close()

            p.terminate()

            with wave.open(file_path, 'wb') as wf:
                wf.setnchannels(channels)
                wf.setsampwidth(p.get_sample_size(format_))
                wf.setframerate(sample_rate)
                wf.writeframes(b''.join(frames))

            print(f"Audio saved to {file_path}")

        except Exception as e:
            print(f"Error: {e}")



    def generate_speech(self, input_text, rxs):
        chat_response =  self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful admissions assistant, if you don't know the answer, make it up, be 100% professional and make it believable. be brief and concise."},
                {"role": "user", "content": input_text},
            ]
        )

        answer = chat_response.choices[0].message.content

        audio_response =  self.client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=answer
        )

        try:
            audio_content = audio_response.content
        except AttributeError:
            print("Failed to get audio content from the API response.")
            return None

        if audio_content:
            speech_file_path = f"./app/audio/{rxs}.mp3"
            with open(speech_file_path, 'wb') as f:
                f.write(audio_content)

            title_response =  self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": """You are a helpful admissions assistant, if you don't know the answer, make it up, be 100% professional. Please restate this question as a very short title not more than 12 words and also Please summarize this answer and be very concise.
                   return the title and answer in the format: title:answer, for example: What is the capital of France?:Paris
                    """},
                    {"role": "user", "content": input_text},
                ]
            )

            print(title_response.choices[0].message.content)
            title = title_response.choices[0].message.content.split(":")[0]
            answer = title_response.choices[0].message.content.split(":")[1]
            
    

            return {
                "title": title,
                "answer": answer,
            }
        else:
            print("Failed to get audio content from the API response.")
            return None

# Example usage:
# asyncio.run(generate_speech("Your input text here", "your_rx_identifier"))

    def play_audio(self, file_path):
        audio = AudioSegment.from_mp3(file_path)
        audio = audio.set_channels(1)

        raw_data = audio.raw_data
        sample_width = audio.sample_width
        frame_rate = audio.frame_rate
        channels = audio.channels

        p = pyaudio.PyAudio()

        stream = p.open(format=p.get_format_from_width(sample_width),
                        channels=channels,
                        rate=frame_rate,
                        output=True)

        stream.write(raw_data)

        stream.stop_stream()
        stream.close()
        p.terminate()

    def transcribe_audio(self, audio_file_path):
        with open(audio_file_path, "rb") as audio_file:
            transcript = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
        print(f"Transcription: {transcript}")
        return transcript.text

    def run_voice_assistant(self):
        while True:
            duration = int(input("Please enter the recording duration in seconds (or type 'exit' to end): "))

            if duration <= 0:
                print("Invalid duration. Please enter a positive number.")
                continue

            if input("Start recording? (y/n): ").lower() != 'y':
                print("Recording canceled.")
                continue

            try:
                temp_audio_file = NamedTemporaryFile(suffix=".mp3", delete=False)
                self.record_and_save_audio(temp_audio_file.name, duration)

                user_input = self.transcribe_audio(temp_audio_file.name)

                response_audio_path = self.generate_speech(user_input)
                self.play_audio("response.mp3")

                print(f"AI: Response audio saved to {response_audio_path}")
            except Exception as e:
                print(f"Error: {e}")

            os.remove(temp_audio_file.name)

# if __name__ == "__main__":
#     voice_assistant = VoiceAssistant()
#     voice_assistant.run_voice_assistant()
