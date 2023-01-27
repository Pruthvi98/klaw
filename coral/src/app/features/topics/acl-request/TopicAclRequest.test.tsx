import { cleanup, screen, waitFor } from "@testing-library/react";
import { waitForElementToBeRemoved } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import TopicAclRequest from "src/app/features/topics/acl-request/TopicAclRequest";
import {
  getMockedResponseGetClusterInfoFromEnv,
  mockGetClusterInfoFromEnv,
  mockGetEnvironments,
} from "src/domain/environment/environment-api.msw";
import { createMockEnvironmentDTO } from "src/domain/environment/environment-test-helper";
import {
  mockedResponseTopicNames,
  mockedResponseTopicTeamLiteral,
  mockGetTopicNames,
  mockGetTopicTeam,
} from "src/domain/topic/topic-api.msw";
import { server } from "src/services/api-mocks/server";
import { customRender } from "src/services/test-utils/render-with-wrappers";

const dataSetup = ({ isAivenCluster }: { isAivenCluster: boolean }) => {
  mockGetEnvironments({
    mswInstance: server,
    response: {
      data: [
        createMockEnvironmentDTO({
          name: "TST",
          id: "1",
          maxPartitions: "6",
          maxReplicationFactor: "2",
          defaultPartitions: "3",
          defaultReplicationFactor: "2",
        }),
        createMockEnvironmentDTO({
          name: "DEV",
          id: "2",
          maxPartitions: undefined,
          maxReplicationFactor: undefined,
          defaultPartitions: "2",
          defaultReplicationFactor: "2",
        }),
        createMockEnvironmentDTO({
          name: "PROD",
          id: "3",
          maxPartitions: "16",
          maxReplicationFactor: "3",
          defaultPartitions: "2",
          defaultReplicationFactor: "2",
        }),
      ],
    },
  });
  mockGetTopicNames({
    mswInstance: server,
    response: mockedResponseTopicNames,
  });
  mockGetTopicTeam({
    mswInstance: server,
    response: mockedResponseTopicTeamLiteral,
    topicName: "aivtopic1",
  });
  mockGetClusterInfoFromEnv({
    mswInstance: server,
    response: getMockedResponseGetClusterInfoFromEnv(isAivenCluster),
  });
};

const assertSkeleton = async () => {
  const skeleton = screen.getByTestId("skeleton");
  expect(skeleton).toBeVisible();
  await waitForElementToBeRemoved(skeleton);
};

const selectTestEnvironment = async () => {
  const environmentField = screen.getByRole("combobox", {
    name: "Select Environment *",
  });
  const option = screen.getByRole("option", { name: "TST" });
  await userEvent.selectOptions(environmentField, option);
};

describe("<TopicAclRequest />", () => {
  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  describe("Form states (producer, consumer)", () => {
    beforeEach(() => {
      dataSetup({ isAivenCluster: true });

      customRender(
        <Routes>
          <Route
            path="/topic/:topicName/acl/request"
            element={<TopicAclRequest />}
          />
        </Routes>,
        {
          queryClient: true,
          memoryRouter: true,
          customRoutePath: "/topic/aivtopic1/acl/request",
        }
      );
    });

    afterEach(cleanup);

    it("renders TopicProducerForm by default", async () => {
      await assertSkeleton();

      const aclProducerTypeInput = screen.getByRole("radio", {
        name: "Producer",
      });
      const aclConsumerTypeInput = screen.getByRole("radio", {
        name: "Consumer",
      });
      // Only rendered in Producer form
      const transactionalIdInput = screen.getByLabelText("Transactional ID");

      expect(aclProducerTypeInput).toBeVisible();
      expect(aclProducerTypeInput).toBeChecked();
      expect(aclConsumerTypeInput).not.toBeChecked();
      expect(transactionalIdInput).toBeVisible();
    });

    it("renders the correct AclIpPrincipleTypeField with Principal option checked when choosing an Aiven cluster environment", async () => {
      await assertSkeleton();

      const principalField = screen.getByRole("radio", {
        name: "Principal",
      });
      const ipField = screen.getByRole("radio", {
        name: "IP",
      });

      expect(principalField).not.toBeEnabled();
      expect(principalField).not.toBeChecked();
      expect(ipField).not.toBeEnabled();
      expect(ipField).not.toBeChecked();

      await selectTestEnvironment();

      await waitFor(() => {
        expect(principalField).toBeEnabled();
        expect(principalField).toBeChecked();
        expect(ipField).toBeDisabled();
        expect(ipField).not.toBeChecked();
      });

      const principalsField = await screen.findByRole("textbox", {
        name: "Service accounts *",
      });

      await waitFor(() => {
        expect(principalsField).toBeVisible();
        expect(principalsField).toBeEnabled();
      });
    });

    it("renders the appropriate form when switching between Producer and Consumer ACL types", async () => {
      await assertSkeleton();

      const aclProducerTypeInput = screen.getByRole("radio", {
        name: "Producer",
      });
      const aclConsumerTypeInput = screen.getByRole("radio", {
        name: "Consumer",
      });

      expect(aclConsumerTypeInput).toBeVisible();
      expect(aclConsumerTypeInput).not.toBeChecked();

      await userEvent.click(aclConsumerTypeInput);

      // Only rendered in Consumer form
      const consumerGroupInput = screen.getByLabelText("Consumer group*");

      expect(aclConsumerTypeInput).toBeChecked();
      expect(aclProducerTypeInput).not.toBeChecked();
      expect(consumerGroupInput).toBeVisible();
    });
  });

  describe("User interaction (TopicProducerForm)", () => {
    beforeEach(() => {
      dataSetup({ isAivenCluster: false });

      customRender(
        <Routes>
          <Route
            path="/topic/:topicName/acl/request"
            element={<TopicAclRequest />}
          />
        </Routes>,
        {
          queryClient: true,
          memoryRouter: true,
          customRoutePath: "/topic/aivtopic1/acl/request",
        }
      );
    });

    afterEach(cleanup);

    it("renders correct fields when selecting IP or Principal in AclIpPrincipleTypeField", async () => {
      await assertSkeleton();

      const ipField = screen.getByRole("radio", { name: "IP" });
      const principalField = screen.getByRole("radio", {
        name: "Principal",
      });
      const hiddenIpsField = screen.queryByRole("textbox", {
        name: "IP addresses *",
      });
      const hiddenPrincipalsField = screen.queryByRole("textbox", {
        name: "SSL DN strings / Usernames *",
      });

      expect(ipField).toBeVisible();
      expect(ipField).not.toBeEnabled();
      expect(ipField).not.toBeChecked();
      expect(principalField).toBeVisible();
      expect(principalField).not.toBeEnabled();
      expect(principalField).not.toBeChecked();
      expect(hiddenIpsField).toBeNull();
      expect(hiddenPrincipalsField).toBeNull();

      await selectTestEnvironment();

      await waitFor(() => expect(principalField).toBeEnabled());

      await userEvent.click(principalField);

      await waitFor(() => expect(principalField).toBeChecked());

      await waitFor(() =>
        screen.findByRole("textbox", {
          name: "SSL DN strings / Usernames *",
        })
      );

      const visiblePrincipalsField = screen.getByRole("textbox", {
        name: "SSL DN strings / Usernames *",
      });
      expect(visiblePrincipalsField).toBeInTheDocument();
      expect(visiblePrincipalsField).toBeEnabled();

      await userEvent.click(ipField);

      await waitFor(() =>
        screen.findByRole("textbox", {
          name: "IP addresses *",
        })
      );

      const visibleIpsField = await screen.getByRole("textbox", {
        name: "IP addresses *",
      });
      expect(visibleIpsField).toBeInTheDocument();
      expect(visibleIpsField).toBeEnabled();
    });

    it("error when entering invalid IP in IPs field", async () => {
      await assertSkeleton();

      const ipField = screen.getByRole("radio", { name: "IP" });

      await selectTestEnvironment();

      await waitFor(() => expect(ipField).toBeEnabled());

      await userEvent.click(ipField);

      await waitFor(() => expect(ipField).toBeChecked());

      await waitFor(() =>
        screen.findByRole("textbox", {
          name: "IP addresses *",
        })
      );

      const visibleIpsField = await screen.getByRole("textbox", {
        name: "IP addresses *",
      });

      await userEvent.type(visibleIpsField, "invalid{Enter}");
      await waitFor(() => expect(visibleIpsField).toBeInvalid());
      await waitFor(() =>
        expect(screen.getByText("Invalid IP address.")).toBeVisible()
      );
    });

    it("does not error when entering valid IP in IPs field", async () => {
      await assertSkeleton();

      const ipField = screen.getByRole("radio", { name: "IP" });

      await selectTestEnvironment();

      await waitFor(() => expect(ipField).toBeEnabled());

      await userEvent.click(ipField);

      await waitFor(() => expect(ipField).toBeChecked());

      await waitFor(() =>
        screen.findByRole("textbox", {
          name: "IP addresses *",
        })
      );

      const visibleIpsField = await screen.getByRole("textbox", {
        name: "IP addresses *",
      });

      await userEvent.type(visibleIpsField, "111.111.11.11{Enter}");
      expect(visibleIpsField).toBeValid();
    });

    it("errors when entering more than 15 IPs in IPs field", async () => {
      await assertSkeleton();

      const ipField = screen.getByRole("radio", { name: "IP" });

      await selectTestEnvironment();

      await waitFor(() => expect(ipField).toBeEnabled());

      await userEvent.click(ipField);

      await waitFor(() => expect(ipField).toBeChecked());

      await waitFor(() =>
        screen.findByRole("textbox", {
          name: "IP addresses *",
        })
      );

      const visibleIpsField = await screen.getByRole("textbox", {
        name: "IP addresses *",
      });

      await userEvent.type(visibleIpsField, "111.111.11.11{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.12{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.13{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.14{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.15{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.16{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.17{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.18{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.19{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.20{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.21{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.22{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.23{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.24{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.25{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.26{Enter}");

      await waitFor(() => expect(visibleIpsField).not.toBeValid());
      await waitFor(() =>
        expect(screen.getByText("Maximum 15 elements allowed.")).toBeVisible()
      );
    });

    it("errors when entering more than 5 elements in Principal field", async () => {
      await assertSkeleton();

      const principalField = screen.getByRole("radio", { name: "Principal" });

      await selectTestEnvironment();

      await waitFor(() => expect(principalField).toBeEnabled());

      await userEvent.click(principalField);

      await waitFor(() => expect(principalField).toBeChecked());

      await waitFor(() =>
        screen.findByRole("textbox", {
          name: "SSL DN strings / Usernames *",
        })
      );

      const visiblePrincipalsField = screen.getByRole("textbox", {
        name: "SSL DN strings / Usernames *",
      });
      expect(visiblePrincipalsField).toBeInTheDocument();
      expect(visiblePrincipalsField).toBeEnabled();

      await userEvent.type(visiblePrincipalsField, "Alice1{Enter}");
      await userEvent.type(visiblePrincipalsField, "Alice2{Enter}");
      await userEvent.type(visiblePrincipalsField, "Alice3{Enter}");
      await userEvent.type(visiblePrincipalsField, "Alice4{Enter}");
      await userEvent.type(visiblePrincipalsField, "Alice5{Enter}");
      await userEvent.type(visiblePrincipalsField, "Alice6{Enter}");

      await waitFor(() => expect(visiblePrincipalsField).not.toBeValid());
      await waitFor(() =>
        expect(screen.getByText("Maximum 5 elements allowed.")).toBeVisible()
      );
    });

    it("errors when entering a wrong value in Transactional ID field", async () => {
      await assertSkeleton();

      const transactionalIdInput = screen.getByLabelText("Transactional ID");

      await userEvent.type(transactionalIdInput, "Hello invalid");
      await userEvent.tab();

      await waitFor(() => expect(transactionalIdInput).not.toBeValid());
      await waitFor(() =>
        expect(
          screen.getByText("Only characters allowed: a-z, A-Z, 0-9, ., _,-.")
        ).toBeVisible()
      );
    });

    it("errors when entering a too long value in Transactional ID field", async () => {
      await assertSkeleton();

      const transactionalIdInput = screen.getByLabelText("Transactional ID");
      const tooLong = new Array(152).join("a");
      await userEvent.type(transactionalIdInput, tooLong);
      await userEvent.tab();

      await waitFor(() => expect(transactionalIdInput).not.toBeValid());
      await waitFor(() =>
        expect(
          screen.getByText(
            "Transactional ID cannot be more than 150 characters."
          )
        ).toBeVisible()
      );
    });

    it("does errors when entering a wrong value in Transactional ID field", async () => {
      await assertSkeleton();

      const transactionalIdInput = screen.getByLabelText("Transactional ID");

      await userEvent.type(transactionalIdInput, "HelloValid");
      await userEvent.tab();

      await waitFor(() => expect(transactionalIdInput).toBeValid());
    });

    it("renders correct fields when selecting Literal or Prefixed in aclPatternType fields", async () => {
      await assertSkeleton();

      const literalField = screen.getByRole("radio", { name: "Literal" });
      const prefixedField = screen.getByRole("radio", {
        name: "Prefixed",
      });
      const hiddenTopicNameField = screen.queryByRole("combobox", {
        name: "Topic name *",
      });
      const hiddenPrefixField = screen.queryByRole("textbox", {
        name: "Prefix *",
      });

      expect(literalField).toBeVisible();
      expect(literalField).toBeEnabled();
      expect(literalField).not.toBeChecked();
      expect(prefixedField).toBeVisible();
      expect(prefixedField).toBeEnabled();
      expect(prefixedField).not.toBeChecked();
      expect(hiddenTopicNameField).toBeNull();
      expect(hiddenPrefixField).toBeNull();

      await userEvent.click(literalField);

      const visibleTopicNameField = await screen.findByRole("combobox", {
        name: "Topic name *",
      });

      expect(hiddenPrefixField).toBeNull();
      expect(visibleTopicNameField).toBeInTheDocument();
      expect(visibleTopicNameField).toBeEnabled();
      expect(visibleTopicNameField).toHaveDisplayValue("aivtopic1");

      await userEvent.click(prefixedField);
      expect(prefixedField).toBeChecked();

      const visiblePrefixField = await screen.findByRole("textbox", {
        name: "Prefix *",
      });

      expect(hiddenTopicNameField).toBeNull();
      expect(visiblePrefixField).toBeInTheDocument();
      expect(visiblePrefixField).toBeEnabled();
      expect(visiblePrefixField).toHaveDisplayValue("aivtopic1");
    });
  });

  describe("User interaction (TopicConsumerForm)", () => {
    beforeEach(() => {
      dataSetup({ isAivenCluster: false });

      customRender(
        <Routes>
          <Route
            path="/topic/:topicName/acl/request"
            element={<TopicAclRequest />}
          />
        </Routes>,
        {
          queryClient: true,
          memoryRouter: true,
          customRoutePath: "/topic/aivtopic1/acl/request",
        }
      );
    });

    afterEach(cleanup);

    it("renders correct fields when selecting IP or Principal in AclIpPrincipleTypeField", async () => {
      await assertSkeleton();

      const aclConsumerTypeInput = screen.getByRole("radio", {
        name: "Consumer",
      });
      await userEvent.click(aclConsumerTypeInput);

      const ipField = screen.getByRole("radio", { name: "IP" });
      const principalField = screen.getByRole("radio", {
        name: "Principal",
      });
      const hiddenIpsField = screen.queryByRole("textbox", {
        name: "IP addresses *",
      });
      const hiddenPrincipalsField = screen.queryByRole("textbox", {
        name: "SSL DN strings / Usernames *",
      });

      expect(ipField).toBeVisible();
      expect(ipField).not.toBeEnabled();
      expect(ipField).not.toBeChecked();
      expect(principalField).toBeVisible();
      expect(principalField).not.toBeEnabled();
      expect(principalField).not.toBeChecked();
      expect(hiddenIpsField).toBeNull();
      expect(hiddenPrincipalsField).toBeNull();

      await selectTestEnvironment();

      await waitFor(() => expect(principalField).toBeEnabled());

      await userEvent.click(principalField);

      await waitFor(() => expect(principalField).toBeChecked());

      await waitFor(() =>
        screen.findByRole("textbox", {
          name: "SSL DN strings / Usernames *",
        })
      );

      const visiblePrincipalsField = screen.getByRole("textbox", {
        name: "SSL DN strings / Usernames *",
      });
      expect(visiblePrincipalsField).toBeInTheDocument();
      expect(visiblePrincipalsField).toBeEnabled();

      await userEvent.click(ipField);

      await waitFor(() =>
        screen.findByRole("textbox", {
          name: "IP addresses *",
        })
      );

      const visibleIpsField = await screen.getByRole("textbox", {
        name: "IP addresses *",
      });
      expect(visibleIpsField).toBeInTheDocument();
      expect(visibleIpsField).toBeEnabled();
    });

    it("error when entering invalid IP in IPs field", async () => {
      await assertSkeleton();

      const aclConsumerTypeInput = screen.getByRole("radio", {
        name: "Consumer",
      });
      await userEvent.click(aclConsumerTypeInput);

      const ipField = screen.getByRole("radio", { name: "IP" });

      await selectTestEnvironment();

      await waitFor(() => expect(ipField).toBeEnabled());

      await userEvent.click(ipField);

      await waitFor(() => expect(ipField).toBeChecked());

      await waitFor(() =>
        screen.findByRole("textbox", {
          name: "IP addresses *",
        })
      );

      const visibleIpsField = await screen.getByRole("textbox", {
        name: "IP addresses *",
      });

      await userEvent.type(visibleIpsField, "invalid{Enter}");
      await waitFor(() => expect(visibleIpsField).toBeInvalid());
    });

    it("does not error when entering valid IP in IPs field", async () => {
      await assertSkeleton();

      const aclConsumerTypeInput = screen.getByRole("radio", {
        name: "Consumer",
      });
      await userEvent.click(aclConsumerTypeInput);

      const ipField = screen.getByRole("radio", { name: "IP" });

      await selectTestEnvironment();

      await waitFor(() => expect(ipField).toBeEnabled());

      await userEvent.click(ipField);

      await waitFor(() => expect(ipField).toBeChecked());

      await waitFor(() =>
        screen.findByRole("textbox", {
          name: "IP addresses *",
        })
      );

      const visibleIpsField = await screen.getByRole("textbox", {
        name: "IP addresses *",
      });

      await userEvent.type(visibleIpsField, "111.111.11.11{Enter}");
      await waitFor(() => expect(visibleIpsField).toBeValid());
    });

    it("errors when entering more than 15 IPs in IPs field", async () => {
      await assertSkeleton();

      const aclConsumerTypeInput = screen.getByRole("radio", {
        name: "Consumer",
      });
      await userEvent.click(aclConsumerTypeInput);

      const ipField = screen.getByRole("radio", { name: "IP" });

      await selectTestEnvironment();

      await waitFor(() => expect(ipField).toBeEnabled());

      await userEvent.click(ipField);

      await waitFor(() => expect(ipField).toBeChecked());

      await waitFor(() =>
        screen.findByRole("textbox", {
          name: "IP addresses *",
        })
      );

      const visibleIpsField = await screen.getByRole("textbox", {
        name: "IP addresses *",
      });

      await userEvent.type(visibleIpsField, "111.111.11.11{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.12{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.13{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.14{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.15{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.16{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.17{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.18{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.19{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.20{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.21{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.22{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.23{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.24{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.25{Enter}");
      await userEvent.type(visibleIpsField, "111.111.11.26{Enter}");

      await waitFor(() => expect(visibleIpsField).not.toBeValid());
      await waitFor(() =>
        expect(screen.getByText("Maximum 15 elements allowed.")).toBeVisible()
      );
    });

    it("errors when entering more than 5 elements in Principal field", async () => {
      await assertSkeleton();

      const aclConsumerTypeInput = screen.getByRole("radio", {
        name: "Consumer",
      });
      await userEvent.click(aclConsumerTypeInput);

      const principalField = screen.getByRole("radio", { name: "Principal" });

      await selectTestEnvironment();

      await waitFor(() => expect(principalField).toBeEnabled());

      await userEvent.click(principalField);

      await waitFor(() => expect(principalField).toBeChecked());

      await waitFor(() =>
        screen.findByRole("textbox", {
          name: "SSL DN strings / Usernames *",
        })
      );

      const visiblePrincipalsField = screen.getByRole("textbox", {
        name: "SSL DN strings / Usernames *",
      });
      expect(visiblePrincipalsField).toBeInTheDocument();
      expect(visiblePrincipalsField).toBeEnabled();

      await userEvent.type(visiblePrincipalsField, "Alice1{Enter}");
      await userEvent.type(visiblePrincipalsField, "Alice2{Enter}");
      await userEvent.type(visiblePrincipalsField, "Alice3{Enter}");
      await userEvent.type(visiblePrincipalsField, "Alice4{Enter}");
      await userEvent.type(visiblePrincipalsField, "Alice5{Enter}");
      await userEvent.type(visiblePrincipalsField, "Alice6{Enter}");

      await waitFor(() => expect(visiblePrincipalsField).not.toBeValid());
      await waitFor(() =>
        expect(screen.getByText("Maximum 5 elements allowed.")).toBeVisible()
      );
    });

    it("errors when entering a wrong value in Consumer Group field", async () => {
      await assertSkeleton();

      const aclConsumerTypeInput = screen.getByRole("radio", {
        name: "Consumer",
      });
      await userEvent.click(aclConsumerTypeInput);

      const consumerGroupInput = screen.getByRole("textbox", {
        name: "Consumer group *",
      });

      await userEvent.type(consumerGroupInput, "Hello invalid");
      await userEvent.tab();

      await waitFor(() => expect(consumerGroupInput).not.toBeValid());
      await waitFor(() =>
        expect(
          screen.getByText("Only characters allowed: a-z, A-Z, 0-9, ., _,-.")
        ).toBeVisible()
      );
    });

    it("errors when entering a too long value in Consumer group field", async () => {
      await assertSkeleton();

      const aclConsumerTypeInput = screen.getByRole("radio", {
        name: "Consumer",
      });
      await userEvent.click(aclConsumerTypeInput);

      const consumerGroupInput = screen.getByRole("textbox", {
        name: "Consumer group *",
      });
      const tooLong = new Array(152).join("a");
      await userEvent.type(consumerGroupInput, tooLong);
      await userEvent.tab();

      await waitFor(() => expect(consumerGroupInput).not.toBeValid());
      await waitFor(() =>
        expect(
          screen.getByText("Consumer group cannot be more than 150 characters.")
        ).toBeVisible()
      );
    });

    it("does errors when entering a wrong value in Consumer group field", async () => {
      await assertSkeleton();

      const aclConsumerTypeInput = screen.getByRole("radio", {
        name: "Consumer",
      });
      await userEvent.click(aclConsumerTypeInput);

      const consumerGroupInput = screen.getByRole("textbox", {
        name: "Consumer group *",
      });

      await userEvent.type(consumerGroupInput, "HelloValid");
      await userEvent.tab();

      await waitFor(() => expect(consumerGroupInput).toBeValid());
    });
  });
});