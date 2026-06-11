@echo off
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Erro: Node.js nao encontrado.
    pause
    exit /b
)
if not exist "setup.js" (
    echo Erro: Arquivo setup.js nao encontrado.
    pause
    exit /b
)
node setup.js
echo Concluido!
pause