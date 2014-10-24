function quicksort(S, i, f){

	var partition = function(A, i, f, pivot){

		var p = A[pivot];
		swap(A, pivot, f-1);
		var next_idx = i;
		for(var ix = i; ix < (f-1); ix++){
			if(A[ix] <= p){
				swap(A, next_idx, ix);
				next_idx++;
			}
		}
		swap(A, f-1, next_idx);
		return next_idx;
	}

	var swap = function(A, a, b){
		var tmp=A[a];
		A[a]=A[b];
		A[b]=tmp;
	}

	if(f-1 > i){
		var pivot = i + Math.floor(Math.random() * (f-i));

		pivot = partition(S, i, f, pivot);

		quicksort(S, i, pivot);
		quicksort(S, pivot+1, f);
	}
}
module.exports = {
  quicksort: quicksort
};
