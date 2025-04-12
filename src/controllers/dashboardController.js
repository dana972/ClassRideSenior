const getDashboardrole = async (req, res) => {
    const role = req.user.role;

    // Role is still pending
    if (role === 'pending') {
        return res.render("pendingRole");
    }

    // Render dashboard view based on role
    switch (role) {
        case 'owner':
            return res.render("busOwnerDashboard", { user: req.user });

        case 'student':
            return res.render("studentDashboard", { user: req.user });

        case 'driver':
            return res.render("driverDashboard", { user: req.user });

        default:
            return res.status(403).render("unauthorized", {
                message: "Access denied. You are not authorized to view the dashboard."
            });
    }
};

module.exports = { getDashboardrole };
