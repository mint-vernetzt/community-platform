import { useTranslation } from "react-i18next";
import { AddIcon, Container, Placeholder, Button } from "./__components";
import { Link } from "@remix-run/react";

export const i18nNS = ["routes/my/projects"];

function MyProjects() {
  const { t } = useTranslation(i18nNS);

  const hasProjects = false;

  return (
    <Container>
      <Container.Header>
        <Container.Title>{t("title")}</Container.Title>
        <Button>
          <Link to="/project/create">
            <AddIcon />
            {t("create")}
          </Link>
        </Button>
      </Container.Header>
      {hasProjects === false ? (
        <Placeholder>
          <Placeholder.Title>{t("placeholder.title")}</Placeholder.Title>
          <Placeholder.Text>{t("placeholder.description")}</Placeholder.Text>
          <Button style="secondary">
            <Link to="/project/create">{t("placeholder.cta")}</Link>
          </Button>
        </Placeholder>
      ) : null}
    </Container>
  );
}

export default MyProjects;
