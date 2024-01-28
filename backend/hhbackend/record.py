import pyaudio
from pydub import AudioSegment
from pydub.playback import play

from pydub import AudioSegment
from pydub.playback import play
def play_audio(file_path):
    audio = AudioSegment.from_mp3(file_path)

    # Convert stereo to mono if needed
    audio = audio.set_channels(1)

    # Get raw audio data
    raw_data = audio.raw_data
    sample_width = audio.sample_width
    frame_rate = audio.frame_rate
    channels = audio.channels

    # Initialize PyAudio
    p = pyaudio.PyAudio()

    # Open stream
    stream = p.open(format=p.get_format_from_width(sample_width),
                    channels=channels,
                    rate=frame_rate,
                    output=True)

    # Play the audio
    stream.write(raw_data)

    # Close the stream and PyAudio
    stream.stop_stream()
    stream.close()
    p.terminate()
        
play_audio("response.mp3")