import { cloudidentity } from "@googleapis/cloudidentity";
import * as logger from "firebase-functions/logger";
import {
  beforeUserCreated as buc,
  HttpsError,
} from "firebase-functions/v2/identity";
import { OAuth2Client } from "google-auth-library";

const validEmail = (email: string): boolean =>
  email.endsWith("satakuntalainenosakunta.fi");

const googleApi = cloudidentity("v1");

const notEmpty = <TValue>(value: TValue | null | undefined): value is TValue =>
  value !== null && value !== undefined;

const getGroups = async (accessToken: string, email: string) => {
  const groups = await googleApi.groups.memberships.searchTransitiveGroups({
    parent: "groups/-",
    query: `member_key_id=='${email}'&&'cloudidentity.googleapis.com/groups.discussion_forum' in labels`,
    auth: new OAuth2Client({
      credentials: {
        access_token: accessToken,
      },
    }),
  });

  if (groups.data.memberships === undefined) {
    throw Error(`Group search failed: ${groups.statusText}`);
  }

  const { memberships } = groups.data;

  return memberships
    .map((membership) => membership.groupKey?.id)
    .filter(notEmpty);
};

const beforeUserCreated = buc(
  {
    region: "europe-north1",
  },
  async (event) => {
    logger.info(event);
    const accessToken = event.credential?.accessToken;
    const email = event.additionalUserInfo?.profile.email;
    if (typeof email !== "string" || !validEmail(email) || !accessToken) {
      throw new HttpsError("invalid-argument", "Invalid email or access token");
    }
    try {
      const groups = await getGroups(accessToken, email);
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
