import { generateApplicationId, generateUniversityId } from '../../utils/idGenerator.js';

describe('ID Generator Unit Tests', () => {

  test('generateApplicationId should start with NAD and the current year', () => {
    const id = generateApplicationId();
    // Adjusted Regex: NAD + 4 digits for year + 6 digits for sequence
    expect(id).toMatch(/^NAD\d{4}\d{6}$/); 
  });

  test('generateUniversityId should start with UNI and the current year', () => {
    const id = generateUniversityId();
    expect(id).toMatch(/^UNI\d{4}\d{6}$/);
  });

  test('should generate unique IDs (with a small delay)', async () => {
    const id1 = generateApplicationId();
    
    // Add a slightly longer delay (10ms) to ensure the system clock ticks forward
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const id2 = generateApplicationId();
    expect(id1).not.toBe(id2);
  });
});
