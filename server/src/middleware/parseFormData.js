// Middleware to parse JSON strings in FormData before validation
export const parseFormData = (req, res, next) => {
  // Only parse if content-type is multipart/form-data
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    // Parse JSON strings for ingredients, steps, tags
    const jsonFields = ['ingredients', 'steps', 'tags'];
    
    jsonFields.forEach((field) => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (e) {
          // If parsing fails, set to empty array for ingredients/steps, empty array for tags
          if (field === 'tags') {
            req.body[field] = [];
          } else {
            req.body[field] = [];
          }
        }
      }
    });

    // Handle isPublic - convert string to boolean
    if (req.body.isPublic !== undefined) {
      if (typeof req.body.isPublic === 'string') {
        req.body.isPublic = req.body.isPublic === 'true' || req.body.isPublic === true;
      } else if (typeof req.body.isPublic === 'boolean') {
        // Already boolean, keep as is
      } else {
        // Default to true if not specified
        req.body.isPublic = true;
      }
    }

    // Convert numeric strings to numbers for prepTime, cookTime, servings
    const numericFields = ['prepTime', 'cookTime', 'servings'];
    numericFields.forEach((field) => {
      if (req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '') {
        if (typeof req.body[field] === 'string') {
          const num = parseInt(req.body[field]);
          if (!isNaN(num)) {
            req.body[field] = num;
          } else {
            delete req.body[field]; // Remove invalid numeric fields
          }
        }
      }
    });

    // Handle empty strings for optional fields - set to undefined
    const optionalFields = ['cuisine', 'category', 'description'];
    optionalFields.forEach((field) => {
      if (req.body[field] === '' || req.body[field] === null) {
        delete req.body[field];
      } else if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = req.body[field].trim();
        if (req.body[field] === '') {
          delete req.body[field];
        }
      }
    });
  }
  
  next();
};

