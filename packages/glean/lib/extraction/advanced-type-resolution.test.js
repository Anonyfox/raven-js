/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { ok } from "node:assert";
import { test } from "node:test";
import { ClassEntity } from "../models/class-entity.js";
import { DocumentationGraph } from "../models/documentation-graph.js";
import { FunctionEntity } from "../models/function-entity.js";
import { PackageEntity } from "../models/package-entity.js";
import { buildEntityReferences } from "./reference-resolution.js";

test("Advanced type resolution - Union types", () => {
	const packageData = { name: "@test/union-types", version: "1.0.0" };
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	// Create entities for type resolution
	const userClass = new ClassEntity("User", "User");
	userClass.moduleId = "user";
	const adminClass = new ClassEntity("Admin", "Admin");
	adminClass.moduleId = "admin";

	// Function with union type parameter
	const processUser = new FunctionEntity("process", "processUser");
	processUser.moduleId = "processor";
	processUser.getAllJSDocTags = () => [
		{
			tagType: "param",
			name: "user",
			type: "User|Admin|string",
			description: "User to process",
		},
	];

	graph.addEntity(userClass);
	graph.addEntity(adminClass);
	graph.addEntity(processUser);

	buildEntityReferences(graph);

	// Verify references were created for union types
	const references = graph.getReferences(processUser.getId());
	ok(references.some((ref) => ref.includes("User")));
	ok(references.some((ref) => ref.includes("Admin")));
});

test("Advanced type resolution - Intersection types", () => {
	const packageData = { name: "@test/intersection-types", version: "1.0.0" };
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	const userClass = new ClassEntity("User", "User");
	userClass.moduleId = "user";
	const auditClass = new ClassEntity("Auditable", "Auditable");
	auditClass.moduleId = "audit";

	const saveUser = new FunctionEntity("save", "saveUser");
	saveUser.moduleId = "service";
	saveUser.getAllJSDocTags = () => [
		{
			tagType: "param",
			name: "user",
			type: "User & Auditable",
			description: "User with audit info",
		},
	];

	graph.addEntity(userClass);
	graph.addEntity(auditClass);
	graph.addEntity(saveUser);

	buildEntityReferences(graph);

	const references = graph.getReferences(saveUser.getId());
	ok(references.some((ref) => ref.includes("User")));
	ok(references.some((ref) => ref.includes("Auditable")));
});

test("Advanced type resolution - Generic types", () => {
	const packageData = { name: "@test/generic-types", version: "1.0.0" };
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	const responseClass = new ClassEntity("ApiResponse", "ApiResponse");
	responseClass.moduleId = "api";
	const userClass = new ClassEntity("User", "User");
	userClass.moduleId = "user";

	const fetchUser = new FunctionEntity("fetch", "fetchUser");
	fetchUser.moduleId = "service";
	fetchUser.getAllJSDocTags = () => [
		{
			tagType: "returns",
			type: "Promise<ApiResponse<User>>",
			description: "Promise resolving to user response",
		},
	];

	graph.addEntity(responseClass);
	graph.addEntity(userClass);
	graph.addEntity(fetchUser);

	buildEntityReferences(graph);

	const references = graph.getReferences(fetchUser.getId());
	ok(references.some((ref) => ref.includes("ApiResponse")));
	ok(references.some((ref) => ref.includes("User")));
});

test("Advanced type resolution - Utility types", () => {
	const packageData = { name: "@test/utility-types", version: "1.0.0" };
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	const userClass = new ClassEntity("User", "User");
	userClass.moduleId = "user";

	const updateUser = new FunctionEntity("update", "updateUser");
	updateUser.moduleId = "service";
	updateUser.getAllJSDocTags = () => [
		{
			tagType: "param",
			name: "updates",
			type: "Partial<User>",
			description: "Partial user updates",
		},
		{
			tagType: "returns",
			type: "Required<User>",
			description: "Complete user object",
		},
	];

	graph.addEntity(userClass);
	graph.addEntity(updateUser);

	buildEntityReferences(graph);

	const references = graph.getReferences(updateUser.getId());
	// Should find User in both Partial<User> and Required<User>
	const userReferences = references.filter((ref) => ref.includes("User"));
	ok(userReferences.length > 0);
});

test("Advanced type resolution - Tuple types", () => {
	const packageData = { name: "@test/tuple-types", version: "1.0.0" };
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	const userClass = new ClassEntity("User", "User");
	userClass.moduleId = "user";
	const errorClass = new ClassEntity("ValidationError", "ValidationError");
	errorClass.moduleId = "error";

	const validateUser = new FunctionEntity("validate", "validateUser");
	validateUser.moduleId = "validator";
	validateUser.getAllJSDocTags = () => [
		{
			tagType: "returns",
			type: "[User, ValidationError[]]",
			description: "User and validation errors",
		},
	];

	graph.addEntity(userClass);
	graph.addEntity(errorClass);
	graph.addEntity(validateUser);

	buildEntityReferences(graph);

	const references = graph.getReferences(validateUser.getId());
	ok(references.some((ref) => ref.includes("User")));
	ok(references.some((ref) => ref.includes("ValidationError")));
});

test("Advanced type resolution - Record types", () => {
	const packageData = { name: "@test/record-types", version: "1.0.0" };
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	const permissionClass = new ClassEntity("Permission", "Permission");
	permissionClass.moduleId = "auth";

	const getUserPermissions = new FunctionEntity(
		"getPermissions",
		"getUserPermissions",
	);
	getUserPermissions.moduleId = "service";
	getUserPermissions.getAllJSDocTags = () => [
		{
			tagType: "returns",
			type: "Record<string, Permission>",
			description: "User permissions by resource",
		},
	];

	graph.addEntity(permissionClass);
	graph.addEntity(getUserPermissions);

	buildEntityReferences(graph);

	const references = graph.getReferences(getUserPermissions.getId());
	ok(references.some((ref) => ref.includes("Permission")));
});

test("Advanced type resolution - Conditional types", () => {
	const packageData = { name: "@test/conditional-types", version: "1.0.0" };
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	const userClass = new ClassEntity("User", "User");
	userClass.moduleId = "user";
	const adminClass = new ClassEntity("Admin", "Admin");
	adminClass.moduleId = "admin";
	const guestClass = new ClassEntity("Guest", "Guest");
	guestClass.moduleId = "guest";

	const getPermissions = new FunctionEntity("permissions", "getPermissions");
	getPermissions.moduleId = "auth";
	getPermissions.getAllJSDocTags = () => [
		{
			tagType: "returns",
			type: "T extends Admin ? User : Guest",
			description: "Conditional permission type",
		},
	];

	graph.addEntity(userClass);
	graph.addEntity(adminClass);
	graph.addEntity(guestClass);
	graph.addEntity(getPermissions);

	buildEntityReferences(graph);

	const references = graph.getReferences(getPermissions.getId());
	ok(references.some((ref) => ref.includes("Admin")));
	ok(references.some((ref) => ref.includes("User")));
	ok(references.some((ref) => ref.includes("Guest")));
});

test("Advanced type resolution - Function types", () => {
	const packageData = { name: "@test/function-types", version: "1.0.0" };
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	const userClass = new ClassEntity("User", "User");
	userClass.moduleId = "user";
	const errorClass = new ClassEntity("ValidationError", "ValidationError");
	errorClass.moduleId = "error";

	const validateField = new FunctionEntity("validate", "validateField");
	validateField.moduleId = "validator";
	validateField.getAllJSDocTags = () => [
		{
			tagType: "param",
			name: "validator",
			type: "function(User): ValidationError[]",
			description: "Validation function",
		},
	];

	graph.addEntity(userClass);
	graph.addEntity(errorClass);
	graph.addEntity(validateField);

	buildEntityReferences(graph);

	const references = graph.getReferences(validateField.getId());
	ok(references.some((ref) => ref.includes("User")));
	ok(references.some((ref) => ref.includes("ValidationError")));
});

test("Advanced type resolution - Object types", () => {
	const packageData = { name: "@test/object-types", version: "1.0.0" };
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	const userClass = new ClassEntity("User", "User");
	userClass.moduleId = "user";
	const metaClass = new ClassEntity("Metadata", "Metadata");
	metaClass.moduleId = "meta";

	const processData = new FunctionEntity("process", "processData");
	processData.moduleId = "processor";
	processData.getAllJSDocTags = () => [
		{
			tagType: "param",
			name: "config",
			type: "{user: User, meta: Metadata}",
			description: "Processing configuration",
		},
	];

	graph.addEntity(userClass);
	graph.addEntity(metaClass);
	graph.addEntity(processData);

	buildEntityReferences(graph);

	const references = graph.getReferences(processData.getId());
	ok(references.some((ref) => ref.includes("User")));
	ok(references.some((ref) => ref.includes("Metadata")));
});

test("Advanced type resolution - Complex nested types", () => {
	const packageData = { name: "@test/complex-types", version: "1.0.0" };
	const packageEntity = new PackageEntity(packageData);
	const graph = new DocumentationGraph(packageEntity);

	const userClass = new ClassEntity("User", "User");
	userClass.moduleId = "user";
	const roleClass = new ClassEntity("Role", "Role");
	roleClass.moduleId = "role";
	const permissionClass = new ClassEntity("Permission", "Permission");
	permissionClass.moduleId = "permission";

	const complexFunction = new FunctionEntity("complex", "complexFunction");
	complexFunction.moduleId = "service";
	complexFunction.getAllJSDocTags = () => [
		{
			tagType: "param",
			name: "data",
			type: "Promise<Record<string, Partial<User & {roles: Role[], permissions: Permission[]}>>>",
			description: "Complex nested type structure",
		},
	];

	graph.addEntity(userClass);
	graph.addEntity(roleClass);
	graph.addEntity(permissionClass);
	graph.addEntity(complexFunction);

	buildEntityReferences(graph);

	const references = graph.getReferences(complexFunction.getId());
	ok(references.some((ref) => ref.includes("User")));
	ok(references.some((ref) => ref.includes("Role")));
	ok(references.some((ref) => ref.includes("Permission")));
});
