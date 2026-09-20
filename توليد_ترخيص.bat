@echo off
chcp 65001 >nul
title مولد تراخيص نظام الكاشير
cls
node tools\generate-license.cjs
echo.
pause
