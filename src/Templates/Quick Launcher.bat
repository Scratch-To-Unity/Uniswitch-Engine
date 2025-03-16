@echo off
setlocal EnableDelayedExpansion

:: Copyright (C) 2025 Big Dream Devs
:: Licensed under the MIT License.
:: You may not use this file except in compliance with the License.
:: You may obtain a copy of the License at:
:: 
::    https://opensource.org/licenses/MIT

echo Uniswitch Project Quick Launcher (Scratch To Unity Converter)
echo --------------------------------
echo :::    ::: ::::    ::: ::::::::::: ::::::::  :::       ::: ::::::::::: ::::::::::: ::::::::  :::    :::
echo :+:    :+: :+:+:   :+:     :+:    :+:    :+: :+:       :+:     :+:         :+:    :+:    :+: :+:    :+:
echo +:+    +:+ :+:+:+  +:+     +:+    +:+        +:+       +:+     +:+         +:+    +:+        +:+    +:+
echo +#+    +:+ +#+ +:+ +#+     +#+    +#++:++#++ +#+  +:+  +#+     +#+         +#+    +#+        +#++:++#++
echo +#+    +#+ +#+  +#+#+#     +#+           +#+ +#+ +#+#+ +#+     +#+         +#+    +#+        +#+    +#+
echo #+#    #+# #+#   #+#+#     #+#    #+#    #+#  #+#+# #+#+#      #+#         #+#    #+#    #+# #+#    #+#
echo  ########  ###    #### ########### ########    ###   ###   ###########     ###     ########  ###    ###
echo --------------------------------
pause


:: Get the directory of the project.. Feel free to change this to a desired path.
set "PROJECT_PATH=%CD%"

:: Known path to Unity Hub. Feel free to change this to your own path.
set "UNITYHUB_PATH=C:\Program Files\Unity Hub\Unity Hub.exe"
if not exist "%UNITYHUB_PATH%" (
    echo Unity Hub not found at "%UNITYHUB_PATH%".
    pause
    exit /b 1
)

echo Retrieving installed Unity Editor via Unity Hub CLI...
for /f "tokens=2 delims=:" %%A in ('""%UNITYHUB_PATH%"" -- --headless editors --installed --output json') do (
    set "rawPath=%%A"
    goto :parsePath
)

echo Could not retrieve Unity Editor information.
pause
exit /b 1

:parsePath
set "rawPath=%rawPath:"=%"
set "rawPath=%rawPath:,=%"
set "UNITY_EDITOR_PATH=D:\%rawPath%"
echo Found Unity Editor at: "%UNITY_EDITOR_PATH%"

if not exist "%UNITY_EDITOR_PATH%" (
    echo Unity Editor not found at the parsed location.
    pause
    exit /b 1
)

echo Opening project "%PROJECT_PATH%" using Unity Editor...
start "" "%UNITY_EDITOR_PATH%" -projectPath "%PROJECT_PATH%"
exit /b
