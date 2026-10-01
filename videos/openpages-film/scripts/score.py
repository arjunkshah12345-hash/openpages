"""Original 120 BPM electronic score + bespoke picture-synced foley.

All oscillators and noise generated locally. No samples or external recordings.
Run from this project: python3 scripts/score.py
"""
from pathlib import Path
import json
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
DURATION = 32
N = SR * DURATION
OUT = Path(__file__).resolve().parents[1] / 'assets' / 'audio'
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(25092026)
music = np.zeros((N, 2), dtype=np.float64)
foley = np.zeros_like(music)


def tone(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def times(duration):
    return np.arange(int(duration * SR)) / SR


def filt(x, cutoff, kind='lowpass'):
    return signal.sosfilt(signal.butter(2, cutoff, btype=kind, fs=SR, output='sos'), x)


def place(bus, x, start, gain=1, pan=0):
    i = int(start * SR)
    if i >= N:
        return
    x = x[:N - i]
    if x.ndim == 1:
        angle = (pan + 1) * np.pi / 4
        bus[i:i+len(x), 0] += x * gain * np.cos(angle)
        bus[i:i+len(x), 1] += x * gain * np.sin(angle)
    else:
        bus[i:i+len(x)] += x * gain


def kick():
    t = times(.42)
    f = 46 + 110 * np.exp(-t * 42)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
    click = filt(rng.normal(0, 1, len(t)), 2800) * np.exp(-t * 230) * .08
    return np.tanh((body + click) * 1.4) * .62


def tick(duration=.095, cutoff=6800):
    t = times(duration)
    n = rng.normal(0, 1, len(t))
    return filt(filt(n, cutoff, 'highpass'), 14500) * np.exp(-t * 70) * .21


def snare():
    t = times(.18)
    n = filt(rng.normal(0, 1, len(t)), 2300, 'highpass')
    body = np.sin(2 * np.pi * 182 * t) * np.exp(-t * 35)
    return n * np.exp(-t * 27) * .12 + body * .12


def bass(note, duration=.33):
    t = times(duration)
    f = tone(note)
    wave = np.sin(2*np.pi*f*t) + .25*np.sin(2*np.pi*2*f*t) + .08*np.sin(2*np.pi*3*f*t)
    env = (1-np.exp(-t*190)) * np.exp(-t*5) * np.minimum(1, (duration-t)/.05)
    return np.tanh(wave * 1.6) * env * .29


def pluck(note, duration=1.35):
    t = times(duration)
    f = tone(note)
    env = (1-np.exp(-t*500))*np.exp(-t*5.1)
    carrier = np.sin(2*np.pi*f*t + .8*np.sin(2*np.pi*f*2*t)*np.exp(-t*9))
    shimmer = .10*np.sin(2*np.pi*f*3.004*t)*np.exp(-t*8)
    return (carrier + shimmer) * env * .22


def pad(notes, duration=4.5):
    t = times(duration)
    stereo = np.zeros((len(t), 2))
    env = np.minimum(t/.55, 1)*np.minimum((duration-t)/1.5, 1)
    for j,n in enumerate(notes):
        f=tone(n)
        for c,detune in enumerate([.9992,1.0008]):
            wave = np.sin(2*np.pi*f*detune*t + .15*np.sin(2*np.pi*.17*t+j))
            wave += .17*np.sin(2*np.pi*f*2.001*t)
            stereo[:,c] += wave * env * .055
    return stereo


def airy(duration=.55, reverse=False):
    t=times(duration)
    x=filt(filt(rng.normal(0,1,len(t)),1100,'highpass'),4800)
    env=np.sin(np.pi*t/duration)**2
    if reverse:
        env=(t/duration)**2*np.minimum((duration-t)/.018,1)
    return x*env*.16


chords = [[50,57,60,64,69],[46,53,57,60,65],[48,55,60,64,67],[45,52,55,59,64]]
roots = [38,34,36,33]
arp = [[74,69,76,72,81,76,69,72],[74,77,69,72,77,74,69,65],
       [76,79,72,67,74,79,76,72],[76,71,69,64,71,76,81,76]]

# Four musical movements. Harmony changes every four seconds.
for section in range(8):
    start=section*4
    chord=chords[section%4]
    place(music,pad(chord),start,.9 if section!=4 else .62)
    if section<7:
        for n in range(16):
            at=start+n*.25
            if section==4 and n<8:
                continue
            if n%4==3 or (section==0 and n<4):
                continue
            note=arp[section%4][n%8]
            x=pluck(note)
            g=.39 if section<4 else .31
            place(music,x,at,g,(-.35,.3,-.15,.45)[n%4])
            place(music,x,at+.375,g*.18,.6 if n%2 else -.6)
            place(music,x,at+.75,g*.08,-.5 if n%2 else .5)

for beat in range(60):
    at=beat*.5
    if 16 <= at < 17.5 or at>=28:
        continue
    intensity=.83 if at>=4 else .67
    place(music,kick(),at,intensity)
    if beat%2==1:
        place(music,snare(),at,.68 if at<24 else .53,.1)
    root=roots[int(at//4)%4]
    if beat%4 in (0,1,3):
        place(music,bass(root),at+.02,.80)
    if beat%4==2:
        place(music,bass(root+12,.24),at+.25,.46)

for step in range(112):
    at=step*.25
    if 16<=at<18:
        continue
    gain=.23 if step%2==0 else .44
    if at<4:
        gain*=.4
    place(music,tick(),at,gain,(-.36 if step%2 else .36))

# Purposeful final resolution, leaving room for the mark and CTA.
place(music,kick(),28,.85)
place(music,pad([50,57,60,64,69],4),28,1.15)
for at,n,g in [(28,74,.85),(28.25,81,.65),(28.5,88,.45)]:
    sig=pluck(n,2.6)
    place(music,sig,at,g,-.2 if n==74 else .2)
    place(music,sig,at+.375,g*.22,.55)

# Custom, exact picture sync. A little tactility, never a whoosh on every cut.
for at in [.02,.52,.95,1.25,1.5,2,2.5,3,8,8.5,9,10,10.5,11.5,12,12.5,13.5,14,
           14.5,15,16,17,18,18.5,19,19.5,20,20.5,21,21.5,24,24.5,25,25.5,26,26.5,27,28,30]:
    t=times(.055)
    body=filt(rng.normal(0,1,len(t)),2100)*np.exp(-t*95)*.25
    body+=np.sin(2*np.pi*780*t)*np.exp(-t*130)*.07
    place(foley,body,at,.55,(-.25 if int(at*2)%2 else .25))
for at in [3.45,7.52,11.55,15.45,19.4,23.5,27.5]:
    place(foley,airy(.5,True),at,.50,-.15)
    place(foley,airy(.3),at+.50,.30,.2)
for at in [4,16,20,28]:
    t=times(.8)
    impact=np.sin(2*np.pi*(43*t+2*(1-np.exp(-t*12))))*np.exp(-t*7)
    place(foley,impact,at,.30)

# Contraction: accelerating micro-grains, linked to the evidence gate at 18–20s.
for j in range(24):
    at=18 + 1.82*(j/24)**.72
    grain=tick(.04,4000)
    place(foley,grain,at,.28, np.sin(j*1.7)*.55)

# Short stereo room/delay. Direct signal stays dominant and mono-compatible.
for bus,wet in [(music,.055),(foley,.045)]:
    dry=bus.copy()
    for lag,g in [(.061,1),(.097,.75),(.149,.5),(.211,.32)]:
        d=int(lag*SR)
        bus[d:,0]+=filt(dry[:-d,1],5200)*wet*g
        bus[d:,1]+=filt(dry[:-d,0],5200)*wet*g

t=np.arange(N)/SR
fade=np.minimum(1,t/.008)*np.minimum(1,(DURATION-t)/1.2)
music*=fade[:,None]
foley*=fade[:,None]
master=music+foley
master=np.tanh(master*1.15)/1.15
master*=.87/max(np.max(np.abs(master)),.01)
for name,bus in [('score',music),('sound-design',foley),('mix',master)]:
    wavfile.write(OUT/f'{name}.wav',SR,(np.clip(bus,-.98,.98)*32767).astype(np.int16))
report={'duration':DURATION,'sample_rate':SR,'bpm':120,'channels':2,
        'source':'Original deterministic synthesis. No third-party music samples.',
        'seed':25092026,'beats':[round(i*.5,2) for i in range(64)],
        'movements':{'opening':0,'workspace':8,'compression':16,'finale':24},
        'peak_dbfs':round(20*np.log10(np.max(np.abs(master))),2)}
(OUT/'score-map.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report | {'beats':'64 quarter notes'}))
