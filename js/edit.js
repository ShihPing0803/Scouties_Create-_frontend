const editForm = document.getElementById('editForm');
const params = new URLSearchParams(location.search);
const storyId = params.get('storyId');
const locId = params.get('locId');
const orderId = Number(params.get('orderId'));

document.addEventListener('DOMContentLoaded', async () => {
    try{
        const response = await fetch(`http://localhost:3000/locationDetails/${storyId}-${locId}-${orderId}`);

        if(response.ok){
            const details = await response.json();

            document.getElementById('direction').value = details.direction || '';
            document.getElementById('challenge').value = details.challenge || '';
            document.getElementById('answer').value = details.answer || '';
            document.getElementById('hint').value = details.hint || '';
            document.getElementById('etc').value = details.etc || '';
        }
        else{
            console.error('Failed to fetch location details:', response.statusText);
            alert('Failed to load location details');
        }
    }
    catch(error){
        console.error('Error fetching location details:', error);
        alert('Failed to load location details');
    }
});

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(editForm);
    const data = Object.fromEntries(formData);

    const id = `${storyId}-${locId}-${orderId}`; 
    const updateDetails = {
        "direction": data.direction,
        "challenge": data.challenge,
        "answer": data.answer,
        "hint": data.hint,
        "etc": data.etc
    };

    try{
        const response = await fetch(`http://localhost:3000/locations/${id}`,{
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateDetails)
        });
        
        if(response.ok){
            alert('Location details updated successfully');
        }
        else{
            console.error('Failed to update location details:', response.statusText);
            alert('Failed to update location details');
        }
    }
    catch(error){
        console.error('Error updating location details:', error);
        alert('Failed to update location details');
    }
});