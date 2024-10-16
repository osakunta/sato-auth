import { cloudidentity } from "@googleapis/cloudidentity";
import * as logger from "firebase-functions/logger";
import {
  beforeUserCreated as buc,
  HttpsError,
} from "firebase-functions/v2/identity";
import { GoogleAuth, OAuth2Client } from "google-auth-library";

const validEmail = (email: string): boolean =>
  email.endsWith("satakuntalainenosakunta.fi");

const googleApi = cloudidentity("v1");

const notEmpty = <TValue>(value: TValue | null | undefined): value is TValue =>
  value !== null && value !== undefined;

const getGroups = async (user: string) => {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-identity.groups.readonly"],
  });
  const authClient = (await auth.getClient()) as OAuth2Client;
  const groups = await googleApi.groups.memberships.searchDirectGroups({
    parent: "groups/-",
    query: `member_key_id == '${user}'`,
    auth: authClient,
  });

  const memberships = groups.data.memberships || [];

  return memberships
    .map((membership) => membership.groupKey?.id)
    .filter(notEmpty);
};

const beforeUserCreated = buc(
  {
    region: "europe-north1",
  },
  async (event) => {
    const email = event.additionalUserInfo?.profile.email;
    if (typeof email !== "string" || !validEmail(email)) {
      throw new HttpsError("invalid-argument", "Invalid email");
    }
    try {
      const groups = await getGroups(email);
      logger.info(`Created user ${email} with groups ${groups}`);
      return {
        customClaims: {
          groups,
        },
      };
    } catch (e) {
      logger.error(e);
      throw new HttpsError("internal", "Failed to fetch groups");
    }
  },
);

// eslint-disable-next-line import/prefer-default-export
export { beforeUserCreated };
