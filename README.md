# Cutter Video

## Descripción
Cutter Video es una herramienta para cortar videos y generar subtítulos basados en un archivo de capítulos y un archivo de subtítulos.

## Requisitos
- Node.js instalado
- ffmpeg instalado y disponible en la línea de comandos

## Archivos necesarios
1. `input/video.mp4`: El archivo de video que se desea procesar.
2. `input/subtitles.srt`: El archivo de subtítulos en formato SRT.
3. `chapters.txt`: Archivo que define los capítulos en el formato:

```
<orden>\t<inicio>\t<fin>\t<nombre>
```

Ejemplo:
```
1\t0:01:18\t0:08:34\tPresentacion_de_la_clase
2\t0:10:40\t2:15:35\tCrear_Cluste_en_Mongo_DB
```

## Uso

1. Coloca los archivos necesarios en las carpetas correspondientes.
2. Ejecuta el siguiente comando para procesar los videos y subtítulos:

```bash
npm run cut
```

## Salida
- Los videos cortados se guardarán en la carpeta `output` con el formato `<orden>_<nombre>.mp4`.
- Los subtítulos correspondientes se guardarán en la misma carpeta con el formato `<orden>_<nombre>.srt`.

