const { default: axios } = require('axios');

const API_KEY =
  'sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912';

const getParsedFilter = (filtersString) => {
  try {
    return JSON.parse(filtersString);
  } catch (_err) {}
};

const getResponseFromFillOut = async (formId, query) => {
  try {
    const apiUrl = `https://api.fillout.com/v1/api/forms/${formId}/submissions`;
    const response = await axios.get(apiUrl, {
      params: query,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    return response.data;
  } catch (err) {
    throw new Error(err);
  }
};

const getAllResponsesFromFillOut = async (formId, query) => {
  try {
    const retData = [],
      limit = 150;
    let offset = 0;
    while (true) {
      const data = await getResponseFromFillOut(formId, {
        ...query,
        offset,
        limit,
      });
      if (!data?.responses?.length) return retData;
      retData.push(...data.responses);
      offset += limit;
    }
  } catch (err) {
    throw new Error(err);
  }
};

const getFilteredData = (data, filters) => {
  if (!data?.length) return [];
  return data.filter((item) => {
    return filters.every((filter) => {
      const { id, condition, value } = filter;
      const question = item.questions.find((q) => q.id === id);
      const questionValue = question?.value;

      if (!questionValue) return false;
      switch (condition) {
        case 'equals':
          return questionValue === value;
        case 'does_not_equal':
          return questionValue !== value;
        case 'greater_than':
          return questionValue > value;
        case 'less_than':
          return questionValue < value;
      }
    });
  });
};

exports.getFilteredResponses = async (req, res) => {
  const { formId } = req.params;
  const { filters, ...query } = req.query;

  try {
    const parsedFilters = getParsedFilter(filters);

    if (!parsedFilters?.length) {
      const data = await getResponseFromFillOut(formId, query);
      return res.send(data);
    }

    const data = await getAllResponsesFromFillOut(formId, query);
    const submissions = getFilteredData(data, parsedFilters);

    const limit = parseInt(query?.limit || 150),
      offset = parseInt(query?.offset) || 0;

    const totalResponses = submissions.length;
    const pageCount = Math.ceil(totalResponses / limit);
    const startIndex = offset;
    const endIndex = Math.min(startIndex + limit, totalResponses);

    return res.send({
      responses: submissions.slice(startIndex, endIndex),
      totalResponses,
      pageCount,
    });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};
