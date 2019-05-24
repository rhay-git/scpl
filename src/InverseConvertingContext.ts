import {
	Attachment,
	MagicVariable,
	NamedVariable,
	Text,
	AttachmentType,
	Shortcut,
	Action,
	ParameterType,
	List,
	Dictionary,
	toParam,
	Aggrandizements,
	inverseCoercionTypes,
	ErrorParameter
} from "./OutputData";
import { getActionFromID } from "./ActionData";

import { inverseGlyphs, inverseColors } from "./Data/ShortcutMeta";

const NUMBER = /^-?(?:[0-9]*\.[0-9]+|[0-9]+)$/;
const IDENTIFIER = /^[A-Za-z@_][A-Za-z0-9@_]*$/;
const ESCAPEDQUOTEDSTRING = (value: string) =>
	value.replace(/(["\\\n])/g, d => (d === "\n" ? "\\n" : `\\${d}`));
const DQUOTEDSTRING = (value: string) => `"${ESCAPEDQUOTEDSTRING(value)}"`;
const ESCAPESQUOTEDSTRING = (value: string) =>
	value.replace(/(['\\\n])/g, d => (d === "\n" ? "\\n" : `\\${d}`));
const SQUOTEDSTRING = (value: string) => `"${ESCAPESQUOTEDSTRING(value)}"`;

// FOR NOW:
// put argument labels on all arguments
// FOR FUTURE:
// look at wfrequiredresources and order things to avoid argument labels as much as possible

export class InverseConvertingContext {
	magicVariablesByUUID: { [key: string]: string };
	magicVariablesByName: { [key: string]: string };
	quotes: '"' | "'";
	indent: string;
	_indentLevel: number;
	constructor(
		options: { quotes?: '"' | "'"; indent?: string | number } = {}
	) {
		this.magicVariablesByName = {};
		this.magicVariablesByUUID = {};
		this.quotes = options.quotes || '"';
		if (typeof options.indent === "number") {
			options.indent = " ".repeat(options.indent);
		}
		this.indent = options.indent || "\t";
		this._indentLevel = 0;
	}

	createActionsAble(value: Shortcut) {
		const res = value.actions.map(action => {
			const createdAction = this.createActionAble(action);
			return `${createdAction}`;
		});
		if (value.color) {
			res.unshift(`@color ${inverseColors[value.color]}`);
		}
		if (value.glyph) {
			res.unshift(`@icon ${inverseGlyphs[value.glyph]}`);
		}
		return res.join("\n");
	}
	createActionAble(value: Action) {
		const result: string[] = [];

		// get action data
		const actionData = getActionFromID(value.id);

		if (!actionData) {
			return `??unknown action with id ${value.id.replace(
				/[^A-Za-z0-9.]/g,
				""
			)}??`;
		}

		// let parameters = actionData.getParameters();
		const order = actionData.getParameterOrder(); // TODO future
		order.forEach(param => {
			if (typeof param === "string") {
				return result.push(
					`??${param.replace(/[^A-Za-z0-9 ]/g, "")}??`
				);
			}

			const paramValue = value.parameters.get(param.internalName);
			if (paramValue === undefined) {
				return;
			}
			if (order.length === 1) {
				return result.push(this.handleArgument(toParam(paramValue)));
			}
			result.push(
				`${param.shortName}=${this.handleArgument(toParam(paramValue))}`
			);
		});

		const uuid = <string | undefined>value.parameters.get("UUID");
		if (uuid) {
			const baseName =
				value.magicvarname ||
				value.name ||
				actionData.name ||
				actionData.shortName ||
				actionData.internalName ||
				"??unnamed??";
			let name = baseName;
			if (this.magicVariablesByName[name]) {
				// magic variables needs to be both by name and by uuid
				for (let i = 1; this.magicVariablesByName[name]; i++) {
					name = baseName + i;
				}
			}
			this.magicVariablesByName[name] = uuid;
			this.magicVariablesByUUID[uuid] = name;
			// add -> argument
			if (name.match(IDENTIFIER)) {
				result.push(`-> mv:${name}`);
			} else {
				result.push(`-> mv:${this.quoteAndEscape(name)}`);
			}
		}

		// const magicVariable = <number|undefined>value.parameters.get("WFControlFlowMode");

		let actionName = actionData.shortName;
		let indentLevel = this._indentLevel;
		const paramResult = result.join(" ");

		const controlFlowMode = <number | undefined>(
			value.parameters.get("WFControlFlowMode")
		);
		if (controlFlowMode === 1) {
			indentLevel = this._indentLevel - 1;
			if (value.id === "is.workflow.actions.conditional") {
				actionName = "otherwise";
			} else if (value.id === "is.workflow.actions.choosefrommenu") {
				actionName = "case";
			} else {
				actionName = "flow";
			}
		} else if (controlFlowMode === 2) {
			this._indentLevel--;
			indentLevel = this._indentLevel;
			actionName = "end";
		} else if (actionData._data.BlockInfo) {
			this._indentLevel++;
		}

		return (
			this.indent.repeat(indentLevel) +
			`${actionName} ${paramResult}`.trim()
		);
	}

	handleArgument(thing: ParameterType): string {
		if (typeof thing === "string") {
			return this.createStringAble(thing);
		}
		if (typeof thing === "number") {
			return this.createNumberAble(thing);
		}
		if (typeof thing === "boolean") {
			return thing.toString();
		}
		if (thing instanceof Attachment) {
			return this.createVariableAble(thing);
		}
		if (thing instanceof Text) {
			return this.createTextAble(thing);
		}
		if (thing instanceof Dictionary) {
			return this.createDictionaryAble(thing);
		}
		if (thing instanceof List) {
			return this.createListAble(thing);
		}
		if (thing instanceof ErrorParameter) {
			return `??error: ${thing.text.replace(/[^A-Za-z0-9 :]/g, "")}??`;
		}
		return "??this argument type is not supported yet??";
	}

	createStringAble(value: string): string {
		// One of: "string", ident, -1.5, \n|barlist (ifend)
		if (value.match(NUMBER)) {
			return value;
		}
		if (value.match(IDENTIFIER)) {
			return value;
		}
		return this.quoteAndEscape(value);
	}
	createNumberAble(data: number): string {
		const value = data.toString();
		if (value.match(NUMBER)) {
			return value;
		}
		if (value.match(IDENTIFIER)) {
			return value;
		}
		return this.quoteAndEscape(value);
	}
	createListAble(value: List): string {
		const items = value.getItems();
		const result = items.map(item => {
			if (typeof item === "string") {
				return this.createStringAble(item);
			}
			if (typeof item === "boolean") {
				return `??booleans are not supported yet in lists in scpl. this boolean was ${item}??`;
			}
			if (item instanceof Text) {
				return this.createTextAble(item);
			}
			if (item instanceof Dictionary) {
				return `??dictionaries in lists are not supported yet??`;
				// return this.createDictionaryAble(item);
			}
			if (item instanceof List) {
				return `??lists in lists are not supported yet??`;
				// return this.createListAble(item);
			}
		});
		return `[${result.join(", ")}]`;
	}
	createDictionaryAble(value: Dictionary): string {
		const result = value.items.map(item => {
			const key = this.createTextAble(item.key, {
				dontAllowOnlyVariable: true
			});
			if (typeof item.value === "boolean") {
				return `${key}: ??booleans are not supported yet in dictionaries in scpl. this boolean was ${
					item.value
				}??`;
			}
			const value = this.handleArgument(item.value);
			return `${key}: ${value}`;
		});
		return `{${result.join(", ")}}`;
	}
	createAggrandizementsAble(value: Aggrandizements | undefined): string {
		if (!value) {
			return "";
		}
		const aggrandizements = [];
		let forKey = "";
		if (value.getForKey) {
			forKey = `.${this.createStringAble(value.getForKey)}`;
		} else if (value.coercionType) {
			aggrandizements.push(
				`as: ${inverseCoercionTypes[value.coercionType]}`
			);
		}
		if (value.getProperty) {
			aggrandizements.push(
				`get: ${value.getProperty.name
					.toLowerCase()
					.replace(/[^a-z]/g, "")}`
			);
		}
		let res = "";
		if (forKey) {
			res += forKey;
		}
		if (aggrandizements.length > 0) {
			res += `{${aggrandizements.join(", ")}}`;
		}
		return res;
	}
	createVariableAble(value: Attachment): string {
		// createVariAble
		if (value instanceof NamedVariable) {
			if (value.varname.match(IDENTIFIER)) {
				return `v:${value.varname}${this.createAggrandizementsAble(
					value.aggrandizements
				)}`;
			}
			return `v:${this.quoteAndEscape(
				value.varname
			)}${this.createAggrandizementsAble(value.aggrandizements)}`;
		}
		if (value instanceof MagicVariable) {
			const varname = this.magicVariablesByUUID[value.uuid];

			if (!varname) {
				return "mv:??broken magic variable??";
			}
			if (varname.match(IDENTIFIER)) {
				return `mv:${varname}${this.createAggrandizementsAble(
					value.aggrandizements
				)}`;
			}
			return `mv:${this.quoteAndEscape(
				varname
			)}${this.createAggrandizementsAble(value.aggrandizements)}`;
		}
		const data: { [key in AttachmentType]: string | undefined } = {
			Clipboard: "clipboard",
			Ask: "askWhenRun",
			CurrentDate: "currentDate",
			ExtensionInput: "shortcutinput",
			Input: "actioninput",
			Variable: undefined,
			ActionOutput: undefined
		};
		if (!data[value.type]) {
			return `s:??internal error: attachmenttype is ${value.type.replace(
				/[^A-Za-z0-9]/g,
				""
			)} which is not known about yet??`;
		}
		return `s:${data[value.type]}${this.createAggrandizementsAble(
			value.aggrandizements
		)}`;
	}
	createTextAble(
		value: Text,
		options: { dontAllowOnlyVariable?: boolean } = {}
	): string {
		const components = value.components();
		const firstComponent = components[0];
		if (
			components.length === 1 &&
			firstComponent instanceof Attachment &&
			!options.dontAllowOnlyVariable
		) {
			return this.createVariableAble(firstComponent);
		}
		let resstr = "";
		components.forEach((component: Attachment | string) => {
			if (typeof component === "string") {
				return (resstr += ESCAPEDQUOTEDSTRING(component));
			}
			resstr += `\\(${this.createVariableAble(component)})`;
		});
		if (resstr.match(IDENTIFIER)) {
			return resstr;
		} // \() will never match identifier
		return `"${resstr}"`;
	}
	quoteAndEscape(val: string): string {
		if (this.quotes === "'") {
			return SQUOTEDSTRING(val);
		}
		return DQUOTEDSTRING(val);
	}
}

/*

invert(icc: InverseConvertingContext, value: unknown) {
	if(value instanceof Variable) {return icc.variable(value);} // v:variable/mv:variable/s:variable
	if(typeof value === "string") {
		if(value.match(/[^A-Za-z]/)) {return value.replace(/(["\\\n])/g, "\"$1\"");} // "Enum Value"
		return value; // EnumValue
	}
	return "??invalid value??";
}

*/
