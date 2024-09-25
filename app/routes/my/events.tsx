import { useTranslation } from "react-i18next";
import { Container, Placeholder, Button, AddIcon } from "./__events.components";
import { Link } from "@remix-run/react";

export const i18nNS = ["routes/my/events"];

function MyEvents() {
  const { t } = useTranslation(i18nNS);
  return (
    <Container>
      <Container.Header>
        <Container.Title>{t("title")}</Container.Title>
        <Button>
          <Link to="/event/create">
            <AddIcon />
            {t("create")}
          </Link>
        </Button>
      </Container.Header>
      <Placeholder>
        <Placeholder.Title>{t("placeholder.title")}</Placeholder.Title>
        <Placeholder.Text>{t("placeholder.description")}</Placeholder.Text>
        <Button style="secondary">
          <Link to="/explore/events">{t("placeholder.cta")}</Link>
        </Button>
      </Placeholder>
    </Container>
  );
}

export default MyEvents;
