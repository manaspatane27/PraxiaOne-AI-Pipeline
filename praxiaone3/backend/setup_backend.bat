@echo off
REM Setup script for Praxia5Chronic Backend on Windows
REM This script will install all dependencies and initialize the project

echo.
echo ====================================
echo Praxia5Chronic Backend Setup
echo ====================================
echo.

REM Check if venv exists
if not exist ".venv" (
    echo Creating Python virtual environment...
    python -m venv .venv
) else (
    echo Virtual environment already exists.
)

REM Activate venv
call .venv\Scripts\activate.bat

echo.
echo Installing dependencies from requirements.txt...
pip install --upgrade pip
pip install -r requirements.txt

echo.
echo Running database migrations...
python manage.py migrate

echo.
echo Creating superuser (optional - skip if already exists)...
echo If prompted, you can create a superuser account now, or skip by pressing Ctrl+C
python manage.py createsuperuser

echo.
echo Collecting static files...
python manage.py collectstatic --noinput

echo.
echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo Next steps:
echo 1. Start Redis server (required for Celery):
echo    - Download from: https://github.com/microsoftarchive/redis/releases
echo    - Or use: redis-server (if installed via WSL)
echo.
echo 2. Start MySQL server
echo    - Update .env with MySQL credentials
echo    - Ensure database exists
echo.
echo 3. Run development server:
echo    python manage.py runserver
echo.
echo 4. In a separate terminal, run Celery worker:
echo    celery -A praxiaone worker -l info
echo.
echo 5. Access API at http://localhost:8000/api/
echo.
echo For production:
echo    gunicorn config.wsgi:application --bind 0.0.0.0:8000
echo.
pause
