#include "addondata.h"
#include "connection.h"

namespace couchnode
{

AddonData::AddonData()
{
}

AddonData::~AddonData()
{
    auto instances = _instances;
    std::for_each(instances.begin(), instances.end(),
                  [](Instance *inst) { delete inst; });
}

void AddonData::add_instance(class Instance *conn)
{
    _instances.push_back(conn);
}

void AddonData::remove_instance(class Instance *conn)
{
    auto connIter = std::find(_instances.begin(), _instances.end(), conn);
    if (connIter != _instances.end()) {
        _instances.erase(connIter);
    }
}

namespace addondata
{

static AddonData *sAddonDataInstance = nullptr;
  
NAN_MODULE_INIT(Init)
{
    sAddonDataInstance = new AddonData();
}

void cleanup(void *p)
{
    delete sAddonDataInstance;
}

AddonData *Get()
{
    return sAddonDataInstance;
}

} // namespace addondata

} // namespace couchnode