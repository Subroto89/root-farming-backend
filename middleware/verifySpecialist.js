const verifySpecialist = async (req, res, next) => {
   try {
      // Check if user has specialist role in their JWT claims
      if (!req.user || req.user.role !== "specialist") {
         return res.status(403).json({
            error: "Access denied. Only agricultural specialists can perform this action.",
         });
      }
      next();
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};
