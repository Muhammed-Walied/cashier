@echo off
title مولد تراخيص نظام الكاشير
cd /d "%~dp0"
start "" npx electron tools/license-gui/main.js
exit
