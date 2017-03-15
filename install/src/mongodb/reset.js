print("Dropping collections...");
db.alert.drop();
db.alertgroup.drop();
db.audit.drop();
db.checklist.drop();
db.entity.drop();
db.entry.drop();
db.event.drop();
db.file.drop();
db.history.drop();
db.incident.drop();
db.intel.drop();
db.nextid.drop();
db.source.drop();
db.tag.drop();
db.user.drop();
db.user.drop();
db.link.drop();
db.guide.drop();
db.appearance.drop();
db.signature.drop();
db.sigbody.drop();

print ("Creating indexes...");
load("./src/mongodb/indexes.js");
print ("Zero-ing the nexid collection...");
load("./src/mongodb/zero_nextid.js");

