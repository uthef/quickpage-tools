const data = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
        "relWorkDir": {
            "type": "string",
            "description": "Relative working directory"
        },
        "relOutputDir": {
            "type": "string",
            "description": "Relative output directory"
        },
        "formatterOptions": {
            "type": "object",
            "properties": {
                "parser": {
                    "type": "string",
                    "enum": ["html"]
                },
                "useTabs": {
                    "type": "boolean"
                },
                "endOfLine": {
                    "type": "string",
                    "enum": ["auto", "lf", "crlf", "cr"]
                },
                "htmlWhitespaceSensitivity": {
                    "type": "string",
                    "enum": ["css", "strict", "ignore"]
                },
                "printWidth": {
                    "type": "number"
                },
                "proseWrap": {
                    "type": "string",
                    "enum": ["always", "never", "preserve"]
                },
                "singleAttributePerLine": {
                    "type": "boolean"
                },
                "singleQuote": {
                    "type": "boolean"
                },
                "semi": {
                    "type": "boolean"
                },
                "jsxSingleQuote": {
                    "type": "boolean"
                },
                "bracketSpacing": {
                    "type": "boolean"
                },
                "bracketSameLine": {
                    "type": "boolean"
                },
                "quoteProps": {
                    "type": "string",
                    "enum": ["as-needed", "consistent", "preserve"]
                },
                "vueIndentScriptAndStyle": {
                    "type": "boolean"
                },
                "insertPragma": {
                    "type": "boolean"
                },
                "trailingComma": {
                    "type": "string",
                    "enum": ["none", "es5", "all"]
                },
                "embeddedLanguageFormatting": {
                    "type": "string",
                    "enum": ["auto", "off"]
                }
            }
        }
    }
};

module.exports = { data }