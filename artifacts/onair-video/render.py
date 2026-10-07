"""Local reproducible renderer: Pillow graphics, Windows speech, FFmpeg MP4."""
import json, math, subprocess, sys, wave
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / 'tools'))
import imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe()
SCENES = json.loads((ROOT / 'scenes.json').read_text(encoding='utf-8'))
W,H,FPS,SR = 1920,1080,24,44100
BG = (8,20,38)
CYAN = (50,216,231)
WHITE = (238,245,252)
MUTED = (159,181,204)
def font(size, bold=False):
    return ImageFont.truetype('C:/Windows/Fonts/' + ('segoeuib.ttf' if bold else 'segoeui.ttf'), size)
def text(d, xy, s, size=36, fill=WHITE, bold=False, center=False):
    f=font(size,bold)
    if center: xy=(xy[0]-d.textlength(s,font=f)/2,xy[1])
    d.text(xy,s,font=f,fill=fill)
logo=Image.open(ROOT.parents[1]/'public/onair-studio-ai-logo.png').convert('RGBA')
logo.thumbnail((240,100))
audio=np.zeros(58*SR, dtype=np.float64)
captions=[]
def stamp(t):
    ms=round(t*1000); return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
for i,s in enumerate(SCENES):
    with wave.open(str(ROOT/f'voice-{i}.wav')) as w:
        rate=w.getframerate(); v=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float)/32768
    # Fit each complete narration inside its scene; leave a final two-second hold.
    available=s['end']-s['start']-(2.3 if i==5 else .65)
    duration=min(len(v)/rate,available)
    sample_count=round(duration*SR)
    v=np.interp(np.linspace(0,len(v)-1,sample_count),np.arange(len(v)),v)
    start=s['start']+.25
    p=round(start*SR); audio[p:p+len(v)]+=v*.88
    words=s['speech'].split(); groups=[words[n:n+8] for n in range(0,len(words),8)]
    pos=0
    for group in groups:
        a=start+duration*pos/len(words); pos+=len(group); b=start+duration*pos/len(words)
        captions.append((a,b,' '.join(group)))
    print(f'Scene {i+1}: voice {duration:.2f}s',flush=True)
# Original quiet instrumental bed with sustained chords and sparse bell notes.
t=np.arange(len(audio))/SR
music=np.zeros_like(audio)
for n,notes in enumerate([(130.81,164.81,196),(110,130.81,164.81),(87.31,110,130.81),(98,123.47,146.83)]):
    for cycle in range(4):
        a=(cycle*4+n)*4
        if a>=58: continue
        mask=(t>=a)&(t<a+4); u=t[mask]-a
        env=np.minimum(u/.8,1)*np.minimum((4-u)/1,1)
        music[mask]+=sum(np.sin(2*np.pi*f*u) for f in notes)*env*.011
for a in np.arange(1,56,2):
    mask=(t>=a)&(t<a+1.5); u=t[mask]-a
    music[mask]+=np.sin(2*np.pi*[523.25,659.25,587.33,783.99][int(a//2)%4]*u)*np.exp(-u*3)*.014
fade=np.minimum(t/1.5,1)*np.minimum((58-t)/2,1)
audio=(audio+music*fade).clip(-1,1)
with wave.open(str(ROOT/'soundtrack.wav'),'wb') as w:
    w.setparams((1,2,SR,len(audio),'NONE','not compressed')); w.writeframes((audio*32767).astype('<i2').tobytes())
(ROOT/'subtitulos.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(a)} --> {stamp(b)}\n{c}' for i,(a,b,c) in enumerate(captions)),encoding='utf-8')
def icon(d,x,y,kind):
    c=CYAN
    if kind%3==0:
        d.rounded_rectangle((x-42,y-38,x+42,y+38),8,outline=c,width=4)
        for k in range(3): d.line((x-25,y-20+k*20,x+25,y-20+k*20),fill=c,width=3)
    elif kind%3==1:
        d.rounded_rectangle((x-42,y-32,x+42,y+30),8,outline=c,width=4)
        d.line((x-15,y+30,x-25,y+45,x+5,y+30),fill=c,width=4)
        for k in range(3): d.ellipse((x-23+k*20,y-3,x-17+k*20,y+3),fill=c)
    else:
        d.ellipse((x-18,y-37,x+18,y-1),outline=c,width=4)
        d.arc((x-38,y-8,x+38,y+52),180,360,fill=c,width=4)
def scene(i,elapsed):
    s=SCENES[i]; im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im)
    d.rectangle((0,0,W,9),fill=CYAN)
    im.paste(logo,(W-100-logo.width,55),logo)
    text(d,(100,64),'ONAIR / ESTUDIO ACADÉMICO',24,CYAN,True)
    text(d,(100,166),s['title'],54 if i==2 else 64,WHITE,True)
    text(d,(100,270),s['sub'],34,MUTED)
    labels=s['labels']; n=len(labels); gap=24; cw=(1720-gap*(n-1))/n
    for k,label in enumerate(labels):
        reveal=max(0,min(1,(elapsed-.55-k*.55)/.65)); ease=1-(1-reveal)**3
        if reveal<=0: continue
        x=100+k*(cw+gap); y=408+(1-ease)*35
        layer=Image.new('RGBA',(W,H)); ld=ImageDraw.Draw(layer)
        ld.rounded_rectangle((x,y,x+cw,y+245),radius=22,fill=(17,39,62),outline=(43,80,107),width=2)
        icon(ld,x+cw/2,y+84,k+i)
        text(ld,(x+cw/2,y+153),label,28 if n==5 else 38,WHITE,True,True)
        if k<n-1: text(ld,(x+cw+gap/2,y+99),'›',40,CYAN,True,True)
        layer.putalpha(layer.getchannel('A').point(lambda a:int(a*ease)))
        im=Image.alpha_composite(im.convert('RGBA'),layer).convert('RGB'); d=ImageDraw.Draw(im)
    if i==2: text(d,(960,712),'Asistencia de IA + revisión y edición del equipo',32,CYAN,center=True)
    if i==3:
        for k,label in enumerate(['01  Apertura · 00:45','02  Desarrollo · 01:30','03  Cierre · 00:30']):
            text(d,(100+580*k,719),label,27,CYAN if k==1 else MUTED)
        text(d,(960,785),'Ejemplo conceptual de una escaleta',22,MUTED,center=True)
    if i==4: text(d,(960,725),'Un equipo, un flujo de trabajo compartido',32,CYAN,center=True)
    if i==5: text(d,(960,728),'Aprender · Organizar · Coordinar',36,CYAN,True,True)
    text(d,(100,1007),'Aplicación académica · Simulación de un noticiero',23,MUTED)
    text(d,(1820,1007),f'0{i+1} / 06',23,MUTED,center=True)
    d.line((100,981,1820,981),fill=(30,56,78),width=2)
    return im
cmd=[FF,'-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0','-i',str(ROOT/'soundtrack.wav'),'-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t','58','-movflags','+faststart',str(ROOT/'OnAir-Studio-AI.mp4')]
log=(ROOT/'render.log').open('w'); p=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=log)
cache={}
for f in range(58*FPS):
    tm=f/FPS; i=next(j for j,s in enumerate(SCENES) if s['start']<=tm<s['end']); elapsed=tm-SCENES[i]['start']
    key=(i,round(min(elapsed,4)*FPS));
    if key not in cache:
        cache.clear()
        cache[key]=scene(i,elapsed)
    im=cache[key].copy()
    if i>0 and elapsed<.6:
        im=Image.blend(scene(i-1,10),im,elapsed/.6)
    d=ImageDraw.Draw(im)
    for a,b,c in captions:
        if a<=tm<b:
            fw=d.textlength(c,font=font(35)); d.rounded_rectangle((960-fw/2-24,878,960+fw/2+24,948),12,fill=(3,10,21)); text(d,(960,891),c,35,WHITE,center=True); break
    if f in [120,480,780,1000,1320]: im.save(ROOT/f'preview-{i+1}.png')
    p.stdin.write(im.tobytes())
    if f%240==0: print(f'Rendering {tm:.0f}/58 seconds',flush=True)
p.stdin.close(); code=p.wait(); log.close()
if code: raise RuntimeError((ROOT/'render.log').read_text()[-3000:])
print('Completed: '+str(ROOT/'OnAir-Studio-AI.mp4'),flush=True)
