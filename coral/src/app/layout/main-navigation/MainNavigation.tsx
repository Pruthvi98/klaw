import { Box, Divider } from "@aivenio/aquarium";
import database from "@aivenio/aquarium/dist/src/icons/database";
import codeBlock from "@aivenio/aquarium/dist/src/icons/codeBlock";
import layoutGroupBy from "@aivenio/aquarium/dist/src/icons/layoutGroupBy";
import people from "@aivenio/aquarium/dist/src/icons/people";
import list from "@aivenio/aquarium/dist/src/icons/list";
import cog from "@aivenio/aquarium/dist/src/icons/cog";
import MainNavigationLink from "src/app/layout/main-navigation/MainNavigationLink";
import MainNavigationSubmenuList from "src/app/layout/main-navigation/MainNavigationSubmenuList";
import useFeatureFlag, { FeatureFlag } from "src/app/hooks/useFeatureFlag";
import { useLocation } from "react-router-dom";

function MainNavigation() {
  const topicAclRequestEnabled = useFeatureFlag(FeatureFlag.TOPIC_ACL_REQUEST);
  const { pathname } = useLocation();

  return (
    <Box
      component={"nav"}
      backgroundColor={"grey-0"}
      aria-label={"Main navigation"}
      width={"full"}
      minHeight={"full"}
      paddingTop={"l2"}
    >
      <ul>
        <li>
          <MainNavigationLink
            icon={database}
            href={`/index`}
            linkText={"Dashboard"}
          />
        </li>
        <li>
          <MainNavigationSubmenuList
            expanded={true}
            icon={codeBlock}
            text={"Topics"}
          >
            <MainNavigationLink
              href={"/coral/topics"}
              linkText={"All Topics"}
              active={pathname === "/coral/topics"}
            />
            {topicAclRequestEnabled ? (
              <MainNavigationLink
                // This link is only intended to be rendered in dev environment
                // So the path does not have a coral/ prefix
                // @TODO: delete when Topic overview / top nac Request dropdown are implemented
                href={"/topic/aivtopic1/subscribe"}
                linkText={"Subscribe"}
                active={pathname.includes("/subscribe")}
              />
            ) : (
              <></>
            )}

            <MainNavigationLink
              href={`/execTopics`}
              linkText={"Approval Requests"}
            />

            <MainNavigationLink
              href={`/myTopicRequests`}
              linkText={"My Team's Requests"}
            />
          </MainNavigationSubmenuList>
        </li>
        <li>
          <MainNavigationSubmenuList
            icon={layoutGroupBy}
            text={"Kafka Connectors"}
          >
            <MainNavigationLink
              href={`/kafkaConnectors`}
              linkText={"All Connectors"}
            />
            <MainNavigationLink
              href={`/execConnectors`}
              linkText={"Connector Requests"}
            />
          </MainNavigationSubmenuList>
        </li>
        <li>
          <MainNavigationSubmenuList icon={people} text={"Users and Teams"}>
            <MainNavigationLink href={`/users`} linkText={"Users"} />
            <MainNavigationLink href={`/teams`} linkText={"Teams"} />
            <MainNavigationLink
              href={`/execUsers`}
              linkText={"User Requests"}
            />
          </MainNavigationSubmenuList>
        </li>
        <li>
          <MainNavigationLink
            icon={list}
            href={`/activityLog`}
            linkText={"Audit Log"}
          />
        </li>
        <li>
          <Box aria-hidden={"true"} paddingTop={"l1"} paddingBottom={"l2"}>
            <Divider direction="horizontal" size={2} />
          </Box>
          <MainNavigationLink
            icon={cog}
            href={`/serverConfig`}
            linkText={"Settings"}
          />
        </li>
      </ul>
    </Box>
  );
}

export default MainNavigation;
