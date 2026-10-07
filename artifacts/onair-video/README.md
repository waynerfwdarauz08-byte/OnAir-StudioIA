# Video explicativo de OnAir Studio AI

Resultado: `OnAir-Studio-AI.mp4`, 58 segundos, 1920 × 1080, horizontal 16:9, 24 fps.

Seis escenas con narración sintética local en español de México (Microsoft Sabina), música instrumental original discreta, subtítulos integrados y transiciones suaves. Utiliza el logotipo del proyecto y diagramas conceptuales. El guion identifica el producto como aplicación académica y la operación como simulación.

Los archivos `scenes.json`, `narrate.ps1` y `render.py` permiten ajustar y repetir la producción. `subtitulos.srt` conserva los subtítulos por separado. No requiere subir el contenido a una plataforma de video.

Para regenerar, ejecutar `narrate.ps1` desde PowerShell y después `render.py` con Python, Pillow, NumPy e imageio-ffmpeg. La carpeta `tools` contiene la dependencia del codificador descargada para esta producción.
