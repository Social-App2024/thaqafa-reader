---
name: js-design-patterns
description: Writes javascript code with quality. Use when adding a new feature in javascript app, adding a new js code or modifying existing js code.
---

## Introduction
Use below JS design patterns when necessary, based on each pattern condition.

---

### 1. Module Pattern

> **Condition:** When you want to encapsulate functionality and variables, to be used by other modules, taking into consideration public and private access.

**Example**

```js
let counter = 0;

const testModule = {
  incrementCounter() {
    return counter++;
  },
  resetCounter() {
    console.log(`counter value prior to reset: ${counter}`);
    counter = 0;
  },
};

// Default export module, without name
export default testModule;
```

---

### 2. Facade Pattern

> **Condition:** When you want to provide a simplified interface to a complex subsystem.

**Example**

```js
// privateMethods.js
const _complex_private = {
  i: 5,
  get() {
    console.log(`current value: ${this.i}`);
  },
  set(val) {
    this.i = val;
  },
  run() {
    console.log('running');
  },
  jump() {
    console.log('jumping');
  },
};

export default _complex_private;
```

```js
// module.js
import _complex_private from './privateMethods.js';

const module = {
  facade({ val, run }) {
    _complex_private.set(val);
    _complex_private.get();
    if (run) {
      _complex_private.run();
    }
  },
};

export default module;
```

---

### 3. PubSub Pattern

> **Condition:** Use when many components depend on each other, and you want to avoid tight coupling.

**Example**

```js
const pubsub = new PubSub();

pubsub.publish('/addFavorite', ['test']);
pubsub.subscribe('/addFavorite', (topic, args) => {
  console.log('test', topic, args);
});

const messageLogger = (topics, data) => {
  console.log(`Logging: ${topics}: ${data}`);
};

// Subscribers listen for topics they have subscribed to and
// invoke a callback function (e.g., messageLogger) once a new
// notification is broadcast on that topic
const subscription = pubsub.subscribe('inbox/newMessage', messageLogger);

// Publishers are in charge of publishing topics or notifications of
// interest to the application. e.g.:
pubsub.publish('inbox/newMessage', 'hello world!');
```
