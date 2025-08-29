import fs from 'node:fs'


// Create the fields of the model
const generateSchemaFields = (fields, bool=false)=>{
if (!fields.length && bool) return "  attribut: {\n      type: String,\n  }";

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

// Create the fields of the create validation
const generateValidationFieldsForCreate = (fields, bool=false)=>{
if (!fields.length && bool) return "  attribut: joi.string()\n";

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

// Create the fields of the update validation
const generateValidationFieldsForUpdate = (fields, bool=false)=>{
if (!fields.length && bool) return "  attribut: joi.string()\n";

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

// Capitalize a string
const capitalize = (str)=>{
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const check = (outputPath, modelName, str)=>{
    if (fs.existsSync(outputPath)) {
        console.error(`❌ The file ${modelName}.${str}.js already exist in '/${str}s' !`);
        process.exit(1);
    }
}

export {generateSchemaFields, generateValidationFieldsForCreate, generateValidationFieldsForUpdate, check, capitalize}