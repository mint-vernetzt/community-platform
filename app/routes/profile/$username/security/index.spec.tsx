import { action, loader } from ".";
import { Profile } from "@prisma/client";
import { badRequest, forbidden } from "remix-utils";
import { getUserByRequest } from "../../../../auth.server";
import { updateProfileByUserId } from "~/profile.server";
import { ProfileFormType } from "../edit/yupSchema";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

// TODO: Tests for email and password change
test("TODO", () => {});
