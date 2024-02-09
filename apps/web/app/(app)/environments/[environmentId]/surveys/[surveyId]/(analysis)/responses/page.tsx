import ResponsePage from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/responses/components/ResponsePage";
import { getServerSession } from "next-auth";

import { authOptions } from "@formbricks/lib/authOptions";
import { RESPONSES_PER_PAGE, WEBAPP_URL } from "@formbricks/lib/constants";
import { getEnvironment } from "@formbricks/lib/environment/service";
import { getDefaultLanguage, translateSurvey } from "@formbricks/lib/i18n/utils";
import { getSurveyLanguages } from "@formbricks/lib/i18n/utils";
import { getMembershipByUserIdTeamId } from "@formbricks/lib/membership/service";
import { getProductByEnvironmentId } from "@formbricks/lib/product/service";
import { getResponses } from "@formbricks/lib/response/service";
import { getSurvey } from "@formbricks/lib/survey/service";
import { getTagsByEnvironmentId } from "@formbricks/lib/tag/service";
import { getTeamByEnvironmentId } from "@formbricks/lib/team/service";
import { getUser } from "@formbricks/lib/user/service";

export default async function Page({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }
  const [responses, survey, environment] = await Promise.all([
    getResponses(params.surveyId, 1),
    getSurvey(params.surveyId),
    getEnvironment(params.environmentId),
  ]);

  if (!environment) {
    throw new Error("Environment not found");
  }
  if (!survey) {
    throw new Error("Survey not found");
  }
  const product = await getProductByEnvironmentId(environment.id);
  if (!product) {
    throw new Error("Product not found");
  }

  const user = await getUser(session.user.id);
  if (!user) {
    throw new Error("User not found");
  }
  const tags = await getTagsByEnvironmentId(params.environmentId);
  const team = await getTeamByEnvironmentId(params.environmentId);
  if (!team) {
    throw new Error("Team not found");
  }
  const defaultLanguageId = getDefaultLanguage(product.languages).id;
  const surveyLanguages = getSurveyLanguages(product, survey);

  const currentUserMembership = await getMembershipByUserIdTeamId(session?.user.id, team.id);

  return (
    <>
      <ResponsePage
        environment={environment}
        responses={responses}
        survey={translateSurvey(survey, surveyLanguages, defaultLanguageId)}
        surveyId={params.surveyId}
        webAppUrl={WEBAPP_URL}
        product={product}
        environmentTags={tags}
        user={user}
        responsesPerPage={RESPONSES_PER_PAGE}
        membershipRole={currentUserMembership?.role}
      />
    </>
  );
}
