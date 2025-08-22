#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

// Récupérer le nom du modèle et les champs depuis la ligne de commande
const [,, modelName, ...fields] = process.argv;

if (!modelName) {
  console.error("❌ Usage: node generate-model.js <ModelName> [field:type:required:default ...]");
  console.error("Exemple: node generate-model.js User name:string:true:John age:number:false:18");
  process.exit(1);
}

// Chemin du dossier models
const modelsDir = path.join(process.cwd(), 'models');

// Crée le dossier models s'il n'existe pas
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir);
  console.log("📁 Dossier 'models' créé !");
}

// Chemin du dossier models
const validationsDir = path.join(process.cwd(), 'validation');

// Crée le dossier models s'il n'existe pas
if (!fs.existsSync(validationsDir)) {
  fs.mkdirSync(validationsDir);
  console.log("📁 Dossier 'validation' créé !");
}

// Chemin du dossier controllers
const controllersDir = path.join(process.cwd(), 'controllers');

// Crée le dossier controllers s'il n'existe pas
if (!fs.existsSync(controllersDir)) {
  fs.mkdirSync(controllersDir);
  console.log("📁 Dossier 'controllers' créé !");
}

// Chemin du dossier routes
const routersDir = path.join(process.cwd(), 'routes');

// Crée le dossier routes s'il n'existe pas
if (!fs.existsSync(routersDir)) {
  fs.mkdirSync(routersDir);
  console.log("📁 Dossier 'routes' créé !");
}

// Fonction pour générer les champs du schema
function generateSchemaFields(fields) {
  if (!fields.length) return "  attribut: {\n      type: String,\n  }";

  return fields.map(f => {
    const [name, type = "String", required = "false", defaultValue] = f.split(":");
    const mongooseType = type.charAt(0).toUpperCase() + type.slice(1);
    let fieldDef = `    ${name}: {\n      type: ${mongooseType}`;
    if (required.toLowerCase() === "true") fieldDef += ",\n      required: true";
    if (defaultValue !== undefined) {
      const defaultVal = mongooseType === "String" ? `'${defaultValue}'` : defaultValue;
      fieldDef += `,\n      default: ${defaultVal}`;
    }
    fieldDef += "\n    }";
    return fieldDef;
  }).join(",\n");
}

// Fonction pour générer les champs de la validation de la création
function generateValidationFieldsForCreate(fields) {
  if (!fields.length) return "  attribut: joi.string()\n";

  return fields.map(f => {
    const [name, type = "String", required = "false"] = f.split(":");
    let joiType;

    switch (type.toLowerCase()) {
      case "string":
        joiType = "joi.string()";
        break;
      case "number":
        joiType = "joi.number()";
        break;
      case "boolean":
        joiType = "joi.boolean()";
        break;
      case "date":
        joiType = "joi.date()";
        break;
      default:
        joiType = "joi.any()"; // fallback
    }

    if (required.toLowerCase() === "true") {
      joiType += ".required()";
    }

    return `  ${name}: ${joiType}`;
  }).join(',\n    ');
}

// Fonction pour générer les champs de la validation de la màj
function generateValidationFieldsForUpdate(fields) {
  if (!fields.length) return "  attribut: joi.string()\n";

  return fields.map(f => {
    const [name, type = "String", required = "false"] = f.split(":");
    let joiType;

    switch (type.toLowerCase()) {
      case "string":
        joiType = "joi.string()";
        break;
      case "number":
        joiType = "joi.number()";
        break;
      case "boolean":
        joiType = "joi.boolean()";
        break;
      case "date":
        joiType = "joi.date()";
        break;
      default:
        joiType = "joi.any()"; // fallback
    }

    return `  ${name}: ${joiType}`;
  }).join(',\n    ');
}

// Contenu du modèle
const templateModel = `import mongoose from 'mongoose';

const ${modelName}Schema = new mongoose.Schema({
${generateSchemaFields(fields)}
}, { timestamps: true });

export default mongoose.model('${capitalize(modelName)}', ${modelName}Schema);
`;

// Contenu du validation
const templateValidation = `import joi from "joi";

export default function ${modelName}Validation(body){
    const ${modelName}Create = joi.object({
    ${generateValidationFieldsForCreate(fields)}
    })

    const ${modelName}Update = joi.object({
    ${generateValidationFieldsForUpdate(fields)}
    })

    return {
        ${modelName}Create: ${modelName}Create.validate(body),
        ${modelName}Update: ${modelName}Update.validate(body),
    }
}
`;

// contenu du controller
const templateController = `import ${capitalize(modelName)} from "../models/${modelName}.model.js"
import ${modelName}Validation from "../validation/${modelName}.validation.js"

const create${capitalize(modelName)} = async(req,res)=>{
    try {
        const {body} = req
        if(!body){
            return res.status(400).json({message: "Pas de données dans la requête"})
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
        res.status(500).json({message: "Erreur serveur", error: error})
    }
}

const getAll${capitalize(modelName)}s = async(req, res) => {
    try {
        const ${modelName}s = await ${capitalize(modelName)}.find()
        return res.status(200).json(${modelName}s)
    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Erreur serveur", error: error})
    }
}

const get${capitalize(modelName)}ById = async(req,res) => {
    try {
        const ${modelName} = await ${capitalize(modelName)}.findById(req.params.id)
        if(!${modelName}){
            return res.status(404).json({message: "${modelName} n'existe pas"})
        }
        return res.status(200).json(${modelName})
    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Erreur serveur", error: error})
    }
}

const update${capitalize(modelName)} = async(req,res) => {
    try {
        const {body} = req
        if(!body){
            return res.status(400).json({message: "Pas de données dans la requête"})
        }

        const {error} = ${modelName}Validation(body).${modelName}Update
        if(error){
            return res.status(401).json(error.details[0].message)
        }
        const updated${capitalize(modelName)} = await ${capitalize(modelName)}.findByIdAndDelete(req.params.id, body, {new: true})
        if(!updated${capitalize(modelName)}){
            res.status(404).json({message: "${modelName} n'existe pas"})
        }
        return res.status(200).json(updated${capitalize(modelName)})
    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Erreur serveur", error: error})
    }
}

const delete${capitalize(modelName)} = async(req, res) => {
    try {
        const ${modelName} = await ${capitalize(modelName)}.findByIdAndDelete(req.params.id)
        if(!${modelName}){
            return res.status(404).json({message: "${modelName} n'existe pas"})
        }
        return res.status(200).json({message: "${modelName} a été supprimé"})
    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Erreur serveur", error: error})
    }
}

export { create${capitalize(modelName)}, getAll${capitalize(modelName)}s, get${capitalize(modelName)}ById, update${capitalize(modelName)}, delete${capitalize(modelName)} }`

// Contenu du router
const templateRouter = `
import { Router } from "express";
import { create${capitalize(modelName)}, getAll${capitalize(modelName)}s, get${capitalize(modelName)}ById, update${capitalize(modelName)} } from "../controllers/${modelName}.controller.js"

const router = Router()

router.post('/new', create${capitalize(modelName)})
router.get('/all', getAll${capitalize(modelName)}s)
router.get('/:id', get${capitalize(modelName)}ById)
router.put('/:id', update${capitalize(modelName)})
router.delete('/:id', delete${capitalize(modelName)})

export default router`

// Chemin complet du fichier
const outputModelPath = path.join(modelsDir, `${modelName}.model.js`);
const outputValidationPath = path.join(validationsDir, `${modelName}.validation.js`);
const outputControllerPath = path.join(controllersDir, `${modelName}.controller.js`);
const outputRouterPath = path.join(routersDir, `${modelName}.route.js`);

// Vérifie si le fichier existe déjà
if (fs.existsSync(outputModelPath)) {
  console.error(`❌ Le fichier ${modelName}.model.js existe déjà dans '/models' !`);
  process.exit(1);
}
if (fs.existsSync(outputValidationPath)) {
  console.error(`❌ Le fichier ${modelName}.validation.js existe déjà dans '/validation' !`);
  process.exit(1);
}
if (fs.existsSync(outputControllerPath)) {
  console.error(`❌ Le fichier ${modelName}.controller.js existe déjà dans '/controllers' !`);
  process.exit(1);
}
if (fs.existsSync(outputRouterPath)) {
  console.error(`❌ Le fichier ${modelName}.route.js existe déjà dans '/routes' !`);
  process.exit(1);
}

// Écrit le fichier
fs.writeFileSync(outputModelPath, templateModel);
console.log(`✅ Model '${modelName}' created with success in 'models/${modelName}.model.js'`);
fs.writeFileSync(outputValidationPath, templateValidation);
console.log(`✅ Validation '${modelName}' crreated with success in 'validation/${modelName}.validation.js'`);
fs.writeFileSync(outputControllerPath, templateController);
console.log(`✅ Controller '${modelName}' created with success in 'controllers/${modelName}.controller.js'`);
fs.writeFileSync(outputRouterPath, templateRouter);
console.log(`✅ Route '${modelName}' created with success in 'routes/${modelName}.route.js'`);
console.log(`Don't forget to add app.use('/${modelName}', ${modelName}Routes) in server.js`)

// Fonction pour mettre la première lettre en majuscule
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}