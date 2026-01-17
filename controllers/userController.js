const db = require("../config/database");

// Get leaderboard - top contributors
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const [leaders] = await db.query(
      `SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.department, 
        u.region, 
        u.expertise, 
        u.role,
        COUNT(d.id) as document_count,
        COALESCE(SUM(d.download_count), 0) as total_downloads
      FROM users u
      LEFT JOIN documents d ON u.id = d.uploader_id
      GROUP BY u.id, u.name, u.email, u.department, u.region, u.expertise, u.role
      ORDER BY document_count DESC, total_downloads DESC
      LIMIT ?`,
      [limit]
    );

    res.json({
      success: true,
      leaderboard: leaders,
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get expert directory - all users with their contributions
exports.getExperts = async (req, res) => {
  try {
    const { department, region, expertise, search } = req.query;

    let query = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.department, 
        u.region, 
        u.expertise, 
        u.role,
        COUNT(d.id) as document_count
      FROM users u
      LEFT JOIN documents d ON u.id = d.uploader_id
      WHERE 1=1
    `;
    const params = [];

    // Department filter
    if (department) {
      query += ` AND u.department = ?`;
      params.push(department);
    }

    // Region filter
    if (region) {
      query += ` AND u.region = ?`;
      params.push(region);
    }

    // Expertise filter
    if (expertise) {
      query += ` AND u.expertise LIKE ?`;
      params.push(`%${expertise}%`);
    }

    // Search filter
    if (search) {
      query += ` AND (u.name LIKE ? OR u.expertise LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ` GROUP BY u.id, u.name, u.email, u.department, u.region, u.expertise, u.role ORDER BY document_count DESC`;

    const [experts] = await db.query(query, params);

    res.json({
      success: true,
      count: experts.length,
      experts,
    });
  } catch (error) {
    console.error("Get experts error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;

    // Get user document count
    const [docCount] = await db.query(
      "SELECT COUNT(*) as count FROM documents WHERE uploader_id = ?",
      [userId]
    );

    // Get total downloads of user's documents
    const [downloads] = await db.query(
      "SELECT SUM(download_count) as total_downloads FROM documents WHERE uploader_id = ?",
      [userId]
    );

    // Get user rank
    const [rankResult] = await db.query(
      `SELECT COUNT(*) + 1 as user_rank 
       FROM (
         SELECT uploader_id, COUNT(*) as doc_count 
         FROM documents 
         GROUP BY uploader_id 
         HAVING doc_count > (
           SELECT COUNT(*) FROM documents WHERE uploader_id = ?
         )
       ) as rankers`,
      [userId]
    );

    res.json({
      success: true,
      stats: {
        document_count: parseInt(docCount[0].count) || 0,
        total_downloads: parseInt(downloads[0].total_downloads) || 0,
        rank: parseInt(rankResult[0].user_rank) || 0,
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all unique departments
exports.getDepartments = async (req, res) => {
  try {
    const [departments] = await db.query(
      "SELECT DISTINCT department FROM users WHERE department IS NOT NULL ORDER BY department"
    );

    res.json({
      success: true,
      departments: departments.map((d) => d.department),
    });
  } catch (error) {
    console.error("Get departments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all unique regions
exports.getRegions = async (req, res) => {
  try {
    const [regions] = await db.query(
      "SELECT DISTINCT region FROM users WHERE region IS NOT NULL ORDER BY region"
    );

    res.json({
      success: true,
      regions: regions.map((r) => r.region),
    });
  } catch (error) {
    console.error("Get regions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
