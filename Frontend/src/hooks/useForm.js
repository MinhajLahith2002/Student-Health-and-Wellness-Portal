import { useState, useCallback } from 'react';

export const useForm = (initialValues = {}, validate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setValues(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Clear error on change if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors || {});
    }
  }, [validate, values]);

  const handleSubmit = async (onSubmit) => {
    setIsSubmitting(true);
    
    const validationErrors = validate ? validate(values) : {};
    setErrors(validationErrors);
    
    // Mark all as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    if (Object.keys(validationErrors).length === 0) {
      try {
        await onSubmit(values);
      } catch (err) {
        setErrors(prev => ({
          ...prev,
          form: err.message || 'Something went wrong'
        }));
      }
    }
    
    setIsSubmitting(false);
  };

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldValue = useCallback((field, value) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }));

    setErrors(prev => {
      if (!prev[field]) {
        return prev;
      }

      return {
        ...prev,
        [field]: null
      };
    });
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setValues,
    setErrors
  };
};
