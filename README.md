# mrmongoo-cli

[![npm version](https://img.shields.io/npm/v/mrmongoo-cli)](https://www.npmjs.com/package/mrmongoo-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A command-line tool to quickly generate **Mongoose models** and their **Joi validations** for Node.js projects.

---

## Installation

### Global installation (recommended for CLI usage)

```bash
npm install -g mrmongoo-cli
````

### Local installation (per project)

```bash
npm install mrmongoo-cli --save-dev
```

You can then run the CLI using `npx`:

```bash
npx mrmongoo-cli User name:string:true:John
```

---

## Usage

Run the CLI command:

```bash
mrmongoo-cli <ModelName> [field:type:required:default ...]
```

### Arguments:

* `ModelName`: Name of the model to create.
* `field:type:required:default` (optional, repeatable for multiple fields):

  * `field` — attribute name
  * `type` — field type (`string`, `number`, `boolean`, `date`), default: `string`
  * `required` — `true` or `false` (default: `false`)
  * `default` — default value (optional)

---

### Example:

```bash
mrmongoo-cli user name:string:true:John age:number:false:18 isAdmin:boolean:false:false
```

This generates:

1. **`models/user.model.js`** — Mongoose model with timestamps.
2. **`validation/user.validation.js`** — Joi validation function for the model.
3. **`controllers/user.controller.js`** — controller with CRUD functions for the model.
4. **`routes/user.route.js`** — routes for each function of the controller.

---

### Features

* Automatically creates `models`, `controllers`, `routes` and `validation` folders if they don't exist.
* Prevents overwriting existing files.
* Capitalizes the model name automatically.

---

### Generated file structure

```
project/
├─ controllers/
│  └─ User.controller.js
├─ models/
│  └─ User.model.js
├─ routes/
│  └─ User.route.js
└─ validation/
   └─ User.validation.js
```

---

### Dependencies

* [mongoose](https://www.npmjs.com/package/mongoose)
* [joi](https://www.npmjs.com/package/joi)

---

### Tips

* Use `npx mrmongoo-cli` for one-off usage without installing globally.
* Always increment your package version when publishing fixes or new features.
* You can add more fields by repeating `field:type:required:default` in the CLI command.

---

### License

MIT

```

---

