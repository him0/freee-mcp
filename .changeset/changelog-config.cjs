const { execSync } = require("child_process");

const REPO_URL = "https://github.com/freee/freee-mcp";

function getPrNumberFromCommit(commit) {
  try {
    const message = execSync(`git log --format=%s -n 1 ${commit}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    const match = message.match(/\(#(\d+)\)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

const getReleaseLine = async (changeset, _type) => {
  const [firstLine, ...futureLines] = changeset.summary
    .split("\n")
    .map((l) => l.trimEnd());

  let commitPrefix = "";
  let prSuffix = "";

  if (changeset.commit) {
    const shortHash = changeset.commit.slice(0, 7);
    commitPrefix = `[\`${shortHash}\`](${REPO_URL}/commit/${changeset.commit}): `;

    const prNumber = getPrNumberFromCommit(changeset.commit);
    if (prNumber) {
      prSuffix = ` ([#${prNumber}](${REPO_URL}/pull/${prNumber}))`;
    }
  }

  let returnVal = `- ${commitPrefix}${firstLine}${prSuffix}`;

  if (futureLines.length > 0) {
    returnVal += `\n${futureLines.map((l) => `  ${l}`).join("\n")}`;
  }

  return returnVal;
};

const getDependencyReleaseLine = async (changesets, dependenciesUpdated) => {
  if (dependenciesUpdated.length === 0) return "";

  const changesetLinks = changesets.map(
    (changeset) =>
      `- Updated dependencies${
        changeset.commit
          ? ` [\`${changeset.commit.slice(0, 7)}\`](${REPO_URL}/commit/${changeset.commit})`
          : ""
      }`,
  );
  const updatedDependenciesList = dependenciesUpdated.map(
    (dependency) => `  - ${dependency.name}@${dependency.newVersion}`,
  );
  return [...changesetLinks, ...updatedDependenciesList].join("\n");
};

module.exports = {
  getReleaseLine,
  getDependencyReleaseLine,
};
