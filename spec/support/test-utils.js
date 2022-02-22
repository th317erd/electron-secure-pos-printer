const Path        = require('path');
const FileSystem  = require('fs');

function matchesSnapshot(name, result) {
  var snapshotPath = Path.resolve(__dirname, '..', 'snapshots', `${name}.snapshot`);

  if (!FileSystem.existsSync(snapshotPath)) {
    FileSystem.writeFileSync(snapshotPath, result, 'utf8');
    return;
  }

  var snapshot = FileSystem.readFileSync(snapshotPath, 'utf8');
  expect(result).toEqual(snapshot);
}

module.exports = {
  matchesSnapshot,
};
