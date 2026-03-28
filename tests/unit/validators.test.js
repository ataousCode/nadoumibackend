import { email, password } from '../../dto/validators.js';

describe('Validators Unit Tests', () => {
  
  describe('Email Validator', () => {
    it('should return no error for a valid email', () => {
      const schema = email();
      const { error } = schema.validate('test@nadoumi.com');
      expect(error).toBeUndefined();
    });

    it('should return an error for an invalid email', () => {
      const schema = email();
      const { error } = schema.validate('not-an-email');
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Please provide a valid email address');
    });
  });

  describe('Password Validator', () => {
    it('should accept a strong password', () => {
      const schema = password();
      const { error } = schema.validate('ProperPassword123');
      expect(error).toBeUndefined();
    });

    it('should reject a password that is too short', () => {
      const schema = password();
      const { error } = schema.validate('weak');
      expect(error).toBeDefined();
    });
  });
});
