#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { generateSchemaFields, generateValidationFieldsForCreate, generateValidationFieldsForUpdate, check, capitalize } from './functions.js'


const [,, modelName, ...fields] = process.argv;

const modelsDir = path.join(process.cwd(), 'models');

if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir);
  console.log("📁 Directory 'models' created");
}

const validationsDir = path.join(process.cwd(), 'validations');

if (!fs.existsSync(validationsDir)) {
  fs.mkdirSync(validationsDir);
  console.log("📁 Directory 'validation' created");
}

const controllersDir = path.join(process.cwd(), 'controllers');

if (!fs.existsSync(controllersDir)) {
  fs.mkdirSync(controllersDir);
  console.log("📁 Directory 'controllers' created");
}

const routersDir = path.join(process.cwd(), 'routes');

if (!fs.existsSync(routersDir)) {
  fs.mkdirSync(routersDir);
  console.log("📁 Directory 'routes' created");
}

const middlewareDir = path.join(process.cwd(), 'middlewares');

if (!fs.existsSync(middlewareDir)) {
  fs.mkdirSync(middlewareDir);
  console.log("📁 Directory 'middleware' created");
}

const templateModel = `
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const ${modelName}Schema = new mongoose.Schema({
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
${generateSchemaFields(fields)}
}, { timestamps: true });

userSchema.pre("save", async function(){
  if(this.isModified("password")){
    this.password = await bcrypt.hash(this.password, 10)
  }
})

userSchema.pre("findOneAndUpdate", async function () {
  let update = this.getUpdate();

  if (update.password) {
    const hashed = await bcrypt.hash(update.password, 10);

    this.setUpdate({
      ...update,
      password: hashed
    });
  }
})

export default mongoose.model('${capitalize(modelName)}', ${modelName}Schema);
`;

const templateValidation = `import joi from "joi";

export default function ${modelName}Validation(body){
    const ${modelName}Create = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required(),
    ${generateValidationFieldsForCreate(fields)}
    })

    const ${modelName}Update = joi.object({
      email: joi.string().email(),
      password: joi.string(),
    ${generateValidationFieldsForUpdate(fields)}
    })

    const ${modelName}Login = joi.object({
      email: joi.string().email(),
      password: joi.string(),
    })

    return {
        ${modelName}Create: ${modelName}Create.validate(body),
        ${modelName}Update: ${modelName}Update.validate(body),
        ${modelName}Login: ${modelName}Login.validate(body),
    }
}
`;

const templateController = `
import ${capitalize(modelName)} from "../models/${modelName}.model.js"
import ${modelName}Validation from "../validations/${modelName}.validation.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const register = async(req,res)=>{
    try {
        const {body} = req
        if(!body){
            return res.status(400).json({message: "No data in the request"})
        }
        const {error} = ${modelName}Validation(body).${modelName}Create
        if(error){
            return res.status(401).json(error.details[0].message)
        }
        const search${capitalize(modelName)} = await ${capitalize(modelName)}.findOne({email: body.email})
        if(search${capitalize(modelName)}){
            return res.status(401).json({message: "user already exists"})
        }
        const ${modelName} = new ${capitalize(modelName)}(body)
        const new${capitalize(modelName)} = await ${modelName}.save()
        return res.status(201).json(new${capitalize(modelName)})        
    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Server error", error: error})
    }
}

const login = async(req, res) => {
    try {
        const {email, password } = req.body
        const { error } = ${modelName}Validation(req.body).${modelName}Login
    
        if(error){
            return res.status(401).json(error.details[0].message)
        }

        const ${modelName} = await ${capitalize(modelName)}.findOne({ email: email})
        if(!${modelName}){
            return res.status(400).json({message: "invalid credentials"})
        }
        const isMatch = bcrypt.compare(password, ${modelName}.password)
        if(!isMatch){
            return res.status(400).json({message: "invalid invalides"})
        }
        res.status(200).json({
            message: ${modelName}.email+" is connected",
            token: jwt.sign({ id: ${modelName}._id, email:  ${modelName}.email }, process.env.SECRET_KEY, { expiresIn: "12h" })
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Server error", error: error})
    }
}

const getAll${capitalize(modelName)}s = async(req, res) => {
    try {
        const ${modelName}s = await ${capitalize(modelName)}.find()
        return res.status(200).json(${modelName}s)
    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Server error", error: error})
    }
}

const get${capitalize(modelName)}ById = async(req,res) => {
    try {
        const ${modelName} = await ${capitalize(modelName)}.findById(req.params.id)
        if(!${modelName}){
            return res.status(404).json({message: "${modelName} doesn't exist"})
        }
        return res.status(200).json(${modelName})
    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Server error", error: error})
    }
}

const update${capitalize(modelName)} = async(req,res) => {
    try {
        const {body} = req
        if(!body){
            return res.status(400).json({message: "No data in the request"})
        }

        const {error} = ${modelName}Validation(body).${modelName}Update
        if(error){
            return res.status(401).json(error.details[0].message)
        }
        const updated${capitalize(modelName)} = await ${capitalize(modelName)}.findByIdAndUpdate(req.params.id, body, {new: true})
        if(!updated${capitalize(modelName)}){
            res.status(404).json({message: "${modelName} doesn't exist"})
        }
        return res.status(200).json(updated${capitalize(modelName)})
    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Server error", error: error})
    }
}

const delete${capitalize(modelName)} = async(req, res) => {
    try {
        const ${modelName} = await ${capitalize(modelName)}.findByIdAndDelete(req.params.id)
        if(!${modelName}){
            return res.status(404).json({message: "${modelName} doesn't exist"})
        }
        return res.status(200).json({message: "${modelName} a été supprimé"})
    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Server error", error: error})
    }
}

export { register, login, getAll${capitalize(modelName)}s, get${capitalize(modelName)}ById, update${capitalize(modelName)}, delete${capitalize(modelName)} }`

const templateRouter = `
import { Router } from "express";
import { register, login, getAll${capitalize(modelName)}s, get${capitalize(modelName)}ById, update${capitalize(modelName)}, delete${capitalize(modelName)} } from "../controllers/${modelName}.controller.js"

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/all', getAll${capitalize(modelName)}s)
router.get('/:id', get${capitalize(modelName)}ById)
router.put('/:id', update${capitalize(modelName)})
router.delete('/:id', delete${capitalize(modelName)})

export default router`

const templateAuth = `
import jwt from "jsonwebtoken"

const auth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Missing token" });
    }
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid token" });
        req.user = user;
        next();
    });
};
export default auth;
`

const outputModelPath = path.join(modelsDir, `${modelName}.model.js`);
const outputValidationPath = path.join(validationsDir, `${modelName}.validation.js`);
const outputControllerPath = path.join(controllersDir, `${modelName}.controller.js`);
const outputRouterPath = path.join(routersDir, `${modelName}.route.js`);
const outputAuthPath = path.join(middlewareDir, `auth.js`);

check(outputModelPath, modelName, "model")
check(outputControllerPath, modelName, "controller")
check(outputRouterPath, modelName, "route")
check(outputValidationPath, modelName, "validation")
if (fs.existsSync(outputAuthPath)) {
  console.error(`❌ The file auth.js already exists '/middlewares' !`);
  process.exit(1);
}

fs.writeFileSync(outputModelPath, templateModel);
console.log(`✅ Model '${modelName}' created with success in 'models/${modelName}.model.js'`);
fs.writeFileSync(outputValidationPath, templateValidation);
console.log(`✅ Validation '${modelName}' created with success in 'validation/${modelName}.validation.js'`);
fs.writeFileSync(outputControllerPath, templateController);
console.log(`✅ Controller '${modelName}' created with success in 'controllers/${modelName}.controller.js'`);
fs.writeFileSync(outputRouterPath, templateRouter);
console.log(`✅ Route '${modelName}' created with success in 'routes/${modelName}.route.js'\n`);
console.log(`Don't forget to add app.use('/${modelName}', ${modelName}Routes) in server.js\n`)
fs.writeFileSync(outputAuthPath, templateAuth);
console.log(`✅ Middleware 'auth.js' created with success in 'middleware/'\n`)
console.log("Don't forget to install jsonwebtoken and to add your 'SECRET_KEY' in '.env'")
