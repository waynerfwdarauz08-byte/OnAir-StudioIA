$ErrorActionPreference = 'Stop'
$videoRoot = $PSScriptRoot
$videoScenes = Get-Content -Raw -Encoding UTF8 (Join-Path $videoRoot 'scenes.json') | ConvertFrom-Json
$videoVoice = New-Object -ComObject SAPI.SpVoice
$videoToken = New-Object -ComObject SAPI.SpObjectToken
$videoToken.SetId('HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech_OneCore\Voices\Tokens\MSTTS_V110_esMX_SabinaM')
$videoVoice.Voice = $videoToken
$videoVoice.Rate = 1
for ($videoIndex = 0; $videoIndex -lt $videoScenes.Count; $videoIndex++) {
    $videoStream = New-Object -ComObject SAPI.SpFileStream
    $videoStream.Open((Join-Path $videoRoot "voice-$videoIndex.wav"), 3)
    $videoVoice.AudioOutputStream = $videoStream
    [void]$videoVoice.Speak($videoScenes[$videoIndex].speech)
    $videoStream.Close()
}
