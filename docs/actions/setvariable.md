
## Set Variable / SetVariable (internally `is.workflow.actions.setvariable`)


## description

### summary

Sets the value of the specified variable to the input of this action.


### usage
```
SetVariable (v:variableName | variableName)
```

### arguments

---

### variable: Variable Input [(Docs)](https://pfgithub.github.io/shortcutslang/gettingstarted#variable-field)
**Placeholder**: ```
		Variable Name
		```
**Allows Variables**: true



Accepts a string with the name of the named variable (v:) you want to set,
or a named variable (v:) that you want to set.


---

### source json (for developers)

```json
{
	"ActionClass": "WFSetVariableAction",
	"ActionKeywords": [
		"programming",
		"scripting",
		"var"
	],
	"Category": "Scripting",
	"Description": {
		"DescriptionSummary": "Sets the value of the specified variable to the input of this action."
	},
	"IconName": "Variable.png",
	"Input": {
		"Multiple": true,
		"Required": true,
		"Types": [
			"WFContentItem"
		]
	},
	"InputPassthrough": true,
	"Name": "Set Variable",
	"Parameters": [
		{
			"Class": "WFVariableFieldParameter",
			"Key": "WFVariableName",
			"Label": "Variable",
			"Placeholder": "Variable Name",
			"TextAlignment": "Right"
		}
	],
	"Subcategory": "Variables"
}
```
