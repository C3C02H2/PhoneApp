"""Utility функции за приложението."""

from datetime import date, timedelta
from typing import List, Tuple


def calculate_streak(checkin_dates: List[date]) -> int:
    """
    Изчислява текущ streak от списък с дати.

    Args:
        checkin_dates: Сортиран списък с дати (низходящо).

    Returns:
        Брой последователни дни.
    """
    if not checkin_dates:
        return 0

    streak = 0
    today = date.today()
    expected = today

    for d in checkin_dates:
        if d == expected:
            streak += 1
            expected -= timedelta(days=1)
        elif d < expected:
            break

    # Ако днес няма check-in, опитваме от вчера
    if streak == 0:
        expected = today - timedelta(days=1)
        for d in checkin_dates:
            if d == expected:
                streak += 1
                expected -= timedelta(days=1)
            elif d < expected:
                break

    return streak


def format_streak_message(streak: int) -> str:
    """Връща мотивационно съобщение за streak."""
    if streak == 0:
        return "Start your streak today!"
    elif streak < 7:
        return f"{streak} day{'s' if streak > 1 else ''} strong! Keep going!"
    elif streak < 30:
        return f"{streak} days! You're building a habit!"
    elif streak < 100:
        return f"{streak} days! Unstoppable!"
    else:
        return f"{streak} days! You're a legend!"

