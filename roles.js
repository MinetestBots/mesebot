const role_rewards = (require("./config.json").role_rewards || []).sort((a, b) => {return a[0] - b[0]});

// Get role reward for current level
function getLevelRole(level) {
    let roleID;
    for (const reward of role_rewards) {
        if (level >= reward[0]) roleID = reward[1];
    }
    return roleID;
}

// Swap out roles if needed
// `user` is a GuildMember
function updateRoles(user, level) {
    if (role_rewards.length <= 0) return;

    const roleID = getLevelRole(level);
    if (roleID && !user.roles.cache.has(roleID)) {
        // Remove old roles (could be optional)
        for (const reward of role_rewards) {
            if (user.roles.cache.has(reward[1])) {
                user.roles.remove(reward[1]);
            }
        }

        user.roles.add(roleID);
        return true;
    }
}

module.exports = {
    getLevelRole,
    updateRoles,
};
