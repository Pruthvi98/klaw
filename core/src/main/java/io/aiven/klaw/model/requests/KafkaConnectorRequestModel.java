package io.aiven.klaw.model.requests;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.io.Serializable;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class KafkaConnectorRequestModel extends BaseRequestModel implements Serializable {

  @NotNull
  @Pattern(message = "Invalid connector name", regexp = "^[a-zA-Z0-9._-]{3,}$")
  private String connectorName;

  private String connectorConfig;

  @NotNull
  @Pattern(message = "Invalid description", regexp = "^[a-zA-Z 0-9_.,-]{3,}$")
  private String description;

  private List<String> possibleTeams;

  private Integer connectorId;

  private String requestor;

  private String approver;

  private String sequence;

  private String approvingTeamId;

  private String otherParams;
}