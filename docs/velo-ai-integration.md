# Интеграция Wix Velo ↔ Flask ↔ OpenAI API

Ниже — рабочая схема внешнего управления проектом через ИИ:

1. **Wix Velo** предоставляет защищённый HTTP endpoint (`backend/http-functions.js`) для команд.
2. **Flask** принимает запросы от вашей внешней системы и проксирует их в Wix и/или OpenAI.
3. **OpenAI API** используется только на серверной стороне (не в браузере и не в публичном Wix-коде).

---

## 1) Wix Velo: HTTP endpoint для команд

> Для HTTP функций в Wix используйте файл `backend/http-functions.js` и экспорт в формате `post_<name>`.

```js
// backend/http-functions.js
import { ok, badRequest, forbidden } from 'wix-http-functions';
import wixData from 'wix-data';

const SECRET_TOKEN = 'replace-with-env-or-secrets-manager';

export async function post_aiIntegration(request) {
  try {
    const authHeader = request.headers?.authorization || request.headers?.Authorization;
    if (authHeader !== `Bearer ${SECRET_TOKEN}`) {
      return forbidden({ body: { error: 'Unauthorized' } });
    }

    const body = await request.body.json();
    const { command, productId, newText } = body || {};

    if (!command) {
      return badRequest({ body: { error: "'command' is required" } });
    }

    if (command === 'updateHeadline') {
      if (!productId || !newText) {
        return badRequest({ body: { error: 'productId and newText are required' } });
      }

      const current = await wixData.get('Products', productId);
      current.headline = newText;
      await wixData.update('Products', current);

      return ok({ body: { success: true, message: 'Headline updated successfully' } });
    }

    return badRequest({ body: { error: `Unknown command: ${command}` } });
  } catch (err) {
    return badRequest({ body: { error: err?.message || 'Invalid request' } });
  }
}
```

### Важные замечания по Velo

- Не храните секреты в коде. Используйте менеджер секретов/переменные окружения.
- Для обновления записи в `wixData` обычно нужен полный объект с `_id`, поэтому делайте `get` → изменение поля → `update`.
- Логируйте входящие команды и ошибки на backend-уровне.

---

## 2) Flask: шлюз к Wix и OpenAI

```python
import os
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

WIX_API_URL = os.environ['WIX_API_URL']
WIX_SECRET_TOKEN = os.environ['WIX_SECRET_TOKEN']
OPENAI_API_KEY = os.environ['OPENAI_API_KEY']


@app.route('/send', methods=['POST'])
def send_to_wix():
    payload = request.get_json(force=True) or {}

    response = requests.post(
        WIX_API_URL,
        headers={'Authorization': f'Bearer {WIX_SECRET_TOKEN}'},
        json={
            'command': payload.get('command'),
            'productId': payload.get('productId'),
            'newText': payload.get('newText')
        },
        timeout=20,
    )

    return jsonify(response.json()), response.status_code


@app.route('/ask', methods=['POST'])
def ask_ai():
    body = request.get_json(force=True) or {}
    user_message = body.get('message', '')

    if not user_message:
        return jsonify({'error': 'message is required'}), 400

    ai_response = requests.post(
        'https://api.openai.com/v1/responses',
        headers={
            'Authorization': f'Bearer {OPENAI_API_KEY}',
            'Content-Type': 'application/json',
        },
        json={
            'model': 'gpt-4.1-mini',
            'input': [
                {'role': 'system', 'content': 'You are a project management assistant.'},
                {'role': 'user', 'content': user_message},
            ],
        },
        timeout=30,
    )
    ai_response.raise_for_status()

    data = ai_response.json()
    return jsonify({'response': data})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
```

---

## 3) Пример вызова

```bash
curl -X POST http://127.0.0.1:5000/send \
  -H 'Content-Type: application/json' \
  -d '{"command":"updateHeadline","productId":"12345","newText":"New Headline"}'
```

---

## 4) Безопасность (минимум)

- Токен в заголовке `Authorization: Bearer ...` обязателен.
- Ограничение частоты запросов на Flask endpoint (`Flask-Limiter`).
- Логи аудита: кто, когда, какую команду отправил.
- Таймауты на все исходящие HTTP-запросы.
- Проверка схемы входных JSON (`pydantic` / `marshmallow`).

---

## 5) Что можно расширить

- Команды `createOrder`, `updateOrderStatus`, `syncInventory`.
- Очередь задач (Celery/RQ) для долгих операций.
- Ролевой доступ (разные токены для read/write/admin).
- Набор системных промптов под разные сценарии (поддержка, контент, аналитика).
