#!/usr/bin/env node
import path from 'path';
import { generateSchemaFields, generateValidationFieldsForCreate, generateValidationFieldsForUpdate, check, capitalize } from './functions.js'
import fs from 'node:fs'
// get the model name and the fields in the command line
const [,, modelName, ...fields] = process.argv;

if (!modelName) {
  console.error("❌ Usage: node generate-model.js <ModelName> [field:type:required:default ...]");
  console.error("Exemple: node generate-model.js User name:string:true:John age:number:false:18");
  process.exit(1);
}

// path of models
const modelsDir = path.join(process.cwd(), 'models');

// Create the path
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir);
  console.log("📁 Directory 'models' created");
}

// Path of validations
const validationsDir = path.join(process.cwd(), 'validations');

// Create the path
if (!fs.existsSync(validationsDir)) {
  fs.mkdirSync(validationsDir);
  console.log("📁 Directory 'validation' created");
}

// Path of controllers
const controllersDir = path.join(process.cwd(), 'controllers');

// Create the path
if (!fs.existsSync(controllersDir)) {
  fs.mkdirSync(controllersDir);
  console.log("📁 Directory 'controllers' created");
}

// Path of routes
const routersDir = path.join(process.cwd(), 'routes');

// Create the path
if (!fs.existsSync(routersDir)) {
  fs.mkdirSync(routersDir);
  console.log("📁 Directory 'routes' created");
}

// Content of the model
const templateModel = `import mongoose from 'mongoose';

const ${modelName}Schema = new mongoose.Schema({
${generateSchemaFields(fields, true)}
}, { timestamps: true });

export default mongoose.model('${capitalize(modelName)}', ${modelName}Schema);
`;

// Content of the validation
const templateValidation = `import joi from "joi";

export default function ${modelName}Validation(body){
    const ${modelName}Create = joi.object({
    ${generateValidationFieldsForCreate(fields, true)}
    })

    const ${modelName}Update = joi.object({
    ${generateValidationFieldsForUpdate(fields, true)}
    })

    return {
        ${modelName}Create: ${modelName}Create.validate(body),
        ${modelName}Update: ${modelName}Update.validate(body),
    }
}
`;

// Content of the controller
const templateController = `import ${capitalize(modelName)} from "../models/${modelName}.model.js"
import ${modelName}Validation from "../validations/${modelName}.validation.js"

const create${capitalize(modelName)} = async(req,res)=>{
    try {
        const {body} = req
        if(!body){
            return res.status(400).json({message: "no data in the request"})
        }
        const {error} = ${modelName}Validation(body).${modelName}Create
        if(error){
            return res.status(401).json(error.details[0].message)
        }
        const ${modelName} = new ${capitalize(modelName)}(body)
        const new${capitalize(modelName)} = await ${modelName}.save()
        return res.status(201).json(new${capitalize(modelName)})        
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
        res.status(500).json({message: "Server Error", error: error})
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
        return res.status(200).json({message: "${modelName} has been deleted"})
    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Server error", error: error})
    }
}

export { create${capitalize(modelName)}, getAll${capitalize(modelName)}s, get${capitalize(modelName)}ById, update${capitalize(modelName)}, delete${capitalize(modelName)} }`

// Content of the router
const templateRouter = `
import { Router } from "express";
import { create${capitalize(modelName)}, getAll${capitalize(modelName)}s, get${capitalize(modelName)}ById, update${capitalize(modelName)}, delete${capitalize(modelName)} } from "../controllers/${modelName}.controller.js"

const router = Router()

router.post('/new', create${capitalize(modelName)})
router.get('/all', getAll${capitalize(modelName)}s)
router.get('/:id', get${capitalize(modelName)}ById)
router.put('/:id', update${capitalize(modelName)})
router.delete('/:id', delete${capitalize(modelName)})

export default router`

// Path to the files
const outputModelPath = path.join(modelsDir, `${modelName}.model.js`);
const outputValidationPath = path.join(validationsDir, `${modelName}.validation.js`);
const outputControllerPath = path.join(controllersDir, `${modelName}.controller.js`);
const outputRouterPath = path.join(routersDir, `${modelName}.route.js`);

// Check if files exist
check(outputModelPath, modelName, "model")
check(outputControllerPath, modelName, "controller")
check(outputRouterPath, modelName, "route")
check(outputValidationPath, modelName, "validation")

// Create files
fs.writeFileSync(outputModelPath, templateModel);
console.log(`✅ Model '${modelName}' created with success in 'models/${modelName}.model.js'`);
fs.writeFileSync(outputValidationPath, templateValidation);
console.log(`✅ Validation '${modelName}' created with success in 'validation/${modelName}.validation.js'`);
fs.writeFileSync(outputControllerPath, templateController);
console.log(`✅ Controller '${modelName}' created with success in 'controllers/${modelName}.controller.js'`);
fs.writeFileSync(outputRouterPath, templateRouter);
console.log(`✅ Route '${modelName}' created with success in 'routes/${modelName}.route.js'`);
console.log(`Don't forget to add app.use('/${modelName}', ${modelName}Routes) in server.js`)
