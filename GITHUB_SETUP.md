# GitHub Actions – настройка за автоматичен билд

## 1. Създай GitHub репозиторий

1. Отиди на https://github.com/new
2. Име: `PhoneApp` или `DoYouTry`
3. Избери **Public** (безплатни неограничени билдове)
4. **Не** създавай README – ще пушнеш съществуващ код
5. Create repository

## 2. Добави EXPO_TOKEN като Secret

1. Създай нов токен: https://expo.dev/accounts/c3c02/settings/access-tokens  
   - Create token → име напр. "GitHub Actions" → Copy

2. В GitHub репото: **Settings** → **Secrets and variables** → **Actions**

3. **New repository secret**  
   - Name: `EXPO_TOKEN1`  
   - Value: влепи токена от Expo

## 3. Инициализирай Git и пушни (ако още не е направено)

От папката на проекта:

```bash
cd c:\Users\GRIGS\Desktop\PhoneApp

# Инициализирай ново repo (ако PhoneApp няма свой .git)
git init

# Добави всичко
git add .
git commit -m "Initial commit - DoYouTry v5"

# Свържи с GitHub (замени с твоя URL)
git remote add origin https://github.com/C3C02H2/PhoneApp.git

# Пушни
git branch -M main
git push -u origin main
```

## 4. Как работи

- **При всеки push в `main`** – автоматично се стартира билд
- **Ръчно** – Actions → Build Android APK → Run workflow

APK-то се генерира в облака на Expo. След приключване:
- Линк в логовете на workflow-а
- Или: https://expo.dev/accounts/c3c02/projects/doyoutry/builds

## 5. Важно

- `EXPO_TOKEN` трябва да е валиден и с права за билд
- При проблеми провери логовете в **Actions** таба
